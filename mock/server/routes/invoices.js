import express from 'express';
import sql from 'mssql';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createWorker } from 'tesseract.js';
import { getPool } from '../config/database.js';

// ── Upload storage config ──────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|bmp|tiff|pdf/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Only image and PDF files are accepted'));
  },
});

// ── OCR helpers ────────────────────────────────────────────────────────────

/** Pull first regex match from text, return null if nothing found */
function extract(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}

/** Extract line items from the OCR table body */
function parseLineItems(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Find header row — must mention both a description-like word and a quantity/price word
  const headerIdx = lines.findIndex(l =>
    /(?:description|item|service|product|particulars)/i.test(l) &&
    /(?:qty|quantity|hours|units|amount|price)/i.test(l)
  );

  if (headerIdx === -1) return [];

  // Find the first footer row (subtotal / total / taxes)
  const footerIdx = lines.findIndex((l, i) =>
    i > headerIdx && /^\s*(?:subtotal|sub-total|sub total|total|amount due|balance due)/i.test(l)
  );

  const bodyLines = lines.slice(headerIdx + 1, footerIdx === -1 ? lines.length : footerIdx);

  // Detect column order from header line
  const headerLine = lines[headerIdx].toLowerCase();
  const qtyFirst = headerLine.indexOf(/qty|quantity|hours|units/i.exec(headerLine)?.[0]) <
                   headerLine.indexOf(/desc|item|service|product|particular/i.exec(headerLine)?.[0] ?? 9999);

  const items = [];

  // ── QTY-first layout: "1  Web Design  500.00  $500.00"
  const patQtyFirst4 = /^(\d[\d,]*(?:\.\d{1,2})?)\s+(.+?)\s+[$£€]?(\d[\d,]*\.\d{2})\s+[$£€]?(\d[\d,]*\.\d{2})\s*$/;
  const patQtyFirst3 = /^(\d[\d,]*(?:\.\d{1,2})?)\s+(.+?)\s+[$£€]?(\d[\d,]*\.\d{2})\s*$/;

  // ── Description-first layout: "Web Design  1  500.00  $500.00"
  const patDescFirst4 = /^(.+?)\s+(\d[\d,]*(?:\.\d{1,2})?)\s+[$£€]?(\d[\d,]*\.\d{2})\s+[$£€]?(\d[\d,]*\.\d{2})\s*$/;
  const patDescFirst3 = /^(.+?)\s+[$£€]?(\d[\d,]*\.\d{2})\s+[$£€]?(\d[\d,]*\.\d{2})\s*$/;
  const patDescFirst2 = /^(.+?)\s+[$£€]?(\d[\d,]*\.\d{2})\s*$/;

  for (const line of bodyLines) {
    if (!line || /^[-=\s]+$/.test(line)) continue;
    if (/(?:sales\s*tax|vat|tax|gst|discount|shipping|delivery)/i.test(line)) continue;

    let m;
    if (qtyFirst) {
      if ((m = line.match(patQtyFirst4))) {
        const qty       = parseFloat(m[1].replace(/,/g, ''));
        const description = m[2].trim();
        const unitPrice = parseFloat(m[3].replace(/,/g, ''));
        const total     = parseFloat(m[4].replace(/,/g, ''));
        if (description.length > 1)
          items.push({ description, qty, unitPrice, total, confidence: 0.85 });
      } else if ((m = line.match(patQtyFirst3))) {
        const qty       = parseFloat(m[1].replace(/,/g, ''));
        const description = m[2].trim();
        const total     = parseFloat(m[3].replace(/,/g, ''));
        const unitPrice = qty > 0 ? parseFloat((total / qty).toFixed(2)) : total;
        if (description.length > 1)
          items.push({ description, qty, unitPrice, total, confidence: 0.72 });
      }
    } else {
      if ((m = line.match(patDescFirst4))) {
        const description = m[1].trim();
        const qty       = parseFloat(m[2].replace(/,/g, ''));
        const unitPrice = parseFloat(m[3].replace(/,/g, ''));
        const total     = parseFloat(m[4].replace(/,/g, ''));
        if (description.length > 1)
          items.push({ description, qty, unitPrice, total, confidence: 0.85 });
      } else if ((m = line.match(patDescFirst3))) {
        const description = m[1].trim();
        const unitPrice = parseFloat(m[2].replace(/,/g, ''));
        const total     = parseFloat(m[3].replace(/,/g, ''));
        const qty       = unitPrice > 0 ? parseFloat((total / unitPrice).toFixed(2)) : 1;
        if (description.length > 1)
          items.push({ description, qty, unitPrice, total, confidence: 0.75 });
      } else if ((m = line.match(patDescFirst2))) {
        const description = m[1].trim();
        const total       = parseFloat(m[2].replace(/,/g, ''));
        if (description.length > 1 && !/^[\d.]+$/.test(description))
          items.push({ description, qty: 1, unitPrice: total, total, confidence: 0.55 });
      }
    }
  }
  return items;
}

/** Parse raw OCR text into structured invoice draft fields */
function parseInvoiceText(rawText) {
  const text = rawText.replace(/\r\n/g, '\n');

  // Amount: look for "total" line with a currency figure
  const totalMatch = text.match(
    /(?:grand\s*total|amount\s*due|total\s*due|total\s*amount)[^\d]*(\d[\d,]*\.?\d{0,2})/i
  ) || text.match(
    /(?:^|\n)\s*total[:\s]*(\d[\d,]*\.?\d{0,2})/im
  );
  const total_amount_ocr = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null;

  // VAT / sales-tax rate — percentage
  // Handles: "VAT: 17%", "Tax rate 8.5%", "Sales Tax (5%)", "GST(10%)"
  const vatRateMatch = text.match(
    /(?:sales\s*tax|vat|tax|gst)\s*(?:rate)?[:\s(]*([\d]{1,2}(?:\.\d{1,2})?)\s*%/i
  );
  const vat_rate = vatRateMatch ? parseFloat(vatRateMatch[1]) : null;

  // VAT / sales-tax amount — monetary value on the same line as the tax label
  // Handles: "Sales Tax (5%)  12.50", "VAT Amount: 85.00", "Tax: 8.50"
  const vatAmtMatch =
    text.match(/(?:sales\s*tax|vat\s*amount|tax\s*amount|gst\s*amount)[^\d\n]*(\d[\d,]*\.\d{2})(?!\s*%)/i) ||
    text.match(/(?:sales\s*tax|vat|tax|gst)\s*(?:\([^)]*\))?[^\d%\n]*(\d[\d,]*\.\d{2})(?!\s*%)/i);
  const vat_amount = vatAmtMatch ? parseFloat(vatAmtMatch[1].replace(/,/g, '')) : null;

  // Subtotal
  const subMatch = text.match(/(?:subtotal|sub-total|sub total)[^\d]*(\d[\d,]*\.?\d{0,2})/i);
  const subtotal = subMatch ? parseFloat(subMatch[1].replace(/,/g, '')) : null;

  // Invoice number
  const invoice_number =
    extract(text, /(?:invoice\s*(?:no|number|#)[:\s.]*)([\w-]+)/i) ||
    extract(text, /(?:inv[.\s#-]*)(\w{3,20})/i);

  // Invoice date — accept common formats
  const dateMatch = text.match(
    /(?:invoice\s*date|issued\s*(?:on)?|date\s*(?:of\s*issue)?)[:\s]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\w+ \d{1,2},?\s*\d{4})/i
  );
  let invoice_date = dateMatch ? dateMatch[1] : null;
  if (invoice_date) {
    const parsed = new Date(invoice_date);
    if (!isNaN(parsed)) invoice_date = parsed.toISOString().split('T')[0];
  }

  // Due date — look for "due date", "payment due", "due by", "pay by", etc.
  const dueDateMatch = text.match(
    /(?:due\s*date|payment\s*due(?:\s*date)?|due\s*by|pay(?:ment)?\s*by|due\s*on)[:\s]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\w+ \d{1,2},?\s*\d{4})/i
  );
  let due_date = dueDateMatch ? dueDateMatch[1] : null;
  if (due_date) {
    const parsed = new Date(due_date);
    if (!isNaN(parsed)) due_date = parsed.toISOString().split('T')[0];
  }

  // Vendor name — first meaningful non-numeric line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const vendor_name = lines.find(l => /[a-z]{3}/i.test(l) && !/invoice|date|no\.|number/i.test(l)) || null;

  // Line items
  const line_items = parseLineItems(text);

  // Compute total fallback: subtotal + vat_amount when OCR didn't find a total line
  const computed_total = (subtotal != null && vat_amount != null) ? subtotal + vat_amount : null;
  const total_amount = total_amount_ocr || computed_total;

  return {
    invoice_number,
    vendor_name,
    invoice_date,
    due_date,
    total_amount,
    vat_rate,
    vat_amount,
    subtotal: subtotal || (total_amount && vat_amount ? +(total_amount - vat_amount).toFixed(2) : null),
    line_items,
    raw_text: rawText,
  };
}

const router = express.Router();

// GET all invoices for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const { status, startDate, endDate } = req.query;
    
    let query = `
      SELECT i.*, u.name as uploaded_by_name
      FROM invoices i
      LEFT JOIN users u ON i.uploaded_by_user_id = u.id
      WHERE i.company_id = @companyId
    `;
    
    const request = pool.request().input('companyId', sql.BigInt, req.params.companyId);
    
    if (status) {
      query += ' AND i.status = @status';
      request.input('status', sql.VarChar(50), status);
    }
    
    if (startDate && endDate) {
      query += ' AND i.invoice_date BETWEEN @startDate AND @endDate';
      request.input('startDate', sql.Date, startDate);
      request.input('endDate', sql.Date, endDate);
    }
    
    query += ' ORDER BY i.invoice_date DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices', message: error.message });
  }
});

// GET invoice by ID with line items
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get invoice
    const invoiceResult = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT * FROM invoices WHERE id = @id');
    
    if (invoiceResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Get line items
    const lineItemsResult = await pool.request()
      .input('invoiceId', sql.BigInt, req.params.id)
      .query('SELECT * FROM invoice_line_items WHERE invoice_id = @invoiceId ORDER BY line_number');
    
    const invoice = invoiceResult.recordset[0];
    invoice.line_items = lineItemsResult.recordset;
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice', message: error.message });
  }
});

// POST create new invoice
router.post('/', async (req, res) => {
  try {
    const {
      company_id, invoice_number, vendor_name, vendor_tax_id,
      invoice_date, due_date, payment_date, subtotal, vat_rate, vat_amount,
      total_amount, currency, uploaded_by_user_id, line_items
    } = req.body;
    
    if (!company_id || !invoice_number || !vendor_name || !invoice_date || !total_amount || !uploaded_by_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const pool = await getPool();
    const transaction = pool.transaction();
    
    try {
      await transaction.begin();
      
      // Insert invoice
      const invoiceResult = await transaction.request()
        .input('company_id', sql.BigInt, company_id)
        .input('invoice_number', sql.VarChar(100), invoice_number)
        .input('vendor_name', sql.VarChar(255), vendor_name)
        .input('vendor_tax_id', sql.VarChar(100), vendor_tax_id)
        .input('invoice_date', sql.Date, invoice_date)
        .input('due_date', sql.Date, due_date)
        .input('payment_date', sql.Date, payment_date)
        .input('subtotal', sql.Decimal(15, 2), subtotal)
        .input('vat_rate', sql.Decimal(5, 2), vat_rate)
        .input('vat_amount', sql.Decimal(15, 2), vat_amount)
        .input('total_amount', sql.Decimal(15, 2), total_amount)
        .input('currency', sql.VarChar(3), currency || 'USD')
        .input('uploaded_by_user_id', sql.BigInt, uploaded_by_user_id)
        .query(`
          INSERT INTO invoices (
            company_id, invoice_number, vendor_name, vendor_tax_id,
            invoice_date, due_date, payment_date, subtotal, vat_rate, vat_amount,
            total_amount, currency, uploaded_by_user_id
          )
          OUTPUT INSERTED.*
          VALUES (
            @company_id, @invoice_number, @vendor_name, @vendor_tax_id,
            @invoice_date, @due_date, @payment_date, @subtotal, @vat_rate, @vat_amount,
            @total_amount, @currency, @uploaded_by_user_id
          )
        `);
      
      const invoice = invoiceResult.recordset[0];
      
      // Insert line items if provided
      if (line_items && line_items.length > 0) {
        for (const item of line_items) {
          await transaction.request()
            .input('invoice_id', sql.BigInt, invoice.id)
            .input('line_number', sql.Int, item.line_number)
            .input('description', sql.VarChar(sql.MAX), item.description)
            .input('category', sql.VarChar(100), item.category)
            .input('quantity', sql.Decimal(10, 2), item.quantity || 1)
            .input('unit_price', sql.Decimal(15, 2), item.unit_price)
            .input('vat_rate', sql.Decimal(5, 2), item.vat_rate)
            .input('total_amount', sql.Decimal(15, 2), item.total_amount)
            .query(`
              INSERT INTO invoice_line_items (
                invoice_id, line_number, description, category, quantity, unit_price, vat_rate, total_amount
              )
              VALUES (
                @invoice_id, @line_number, @description, @category, @quantity, @unit_price, @vat_rate, @total_amount
              )
            `);
        }
      }
      
      await transaction.commit();
      res.status(201).json(invoice);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice', message: error.message });
  }
});

// PUT update invoice status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('status', sql.VarChar(50), status)
      .query(`
        UPDATE invoices
        SET status = @status, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status', message: error.message });
  }
});

// POST upload invoice file + OCR extraction
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  // PDF not directly readable by Tesseract – skip OCR, return file metadata only
  const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
  if (isPdf) {
    return res.json({
      file: {
        original_file_name: file.originalname,
        stored_file_name: file.filename,
        file_path: file.path,
        file_type: 'pdf',
        file_size_kb: Math.round(file.size / 1024),
        mime_type: file.mimetype,
      },
      extracted: null,
      ocr_skipped: true,
      message: 'PDF uploaded. Please enter invoice details manually.',
    });
  }

  // Run Tesseract OCR on image
  let extracted = null;
  let ocrError = null;
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(file.path);
    await worker.terminate();
    extracted = parseInvoiceText(text);
  } catch (err) {
    ocrError = err.message;
    console.error('OCR error:', err);
  }

  res.json({
    file: {
      original_file_name: file.originalname,
      stored_file_name: file.filename,
      file_path: file.path,
      file_type: path.extname(file.originalname).replace('.', '').toLowerCase(),
      file_size_kb: Math.round(file.size / 1024),
      mime_type: file.mimetype,
    },
    extracted,
    ocr_error: ocrError,
  });
});

export default router;
