import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

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

export default router;
