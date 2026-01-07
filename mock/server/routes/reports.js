import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

const router = express.Router();

// GET VAT reports for a company
router.get('/vat/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT v.*, u.name as created_by_name
        FROM vat_reports v
        LEFT JOIN users u ON v.created_by_user_id = u.id
        WHERE v.company_id = @companyId
        ORDER BY v.period_end DESC
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching VAT reports:', error);
    res.status(500).json({ error: 'Failed to fetch VAT reports', message: error.message });
  }
});

// GET dashboard statistics
router.get('/dashboard/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get invoice stats
    const invoiceStats = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT 
          COUNT(*) as total_invoices,
          SUM(total_amount) as total_amount,
          SUM(CASE WHEN is_matched = 1 THEN 1 ELSE 0 END) as matched_invoices,
          SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) as pending_invoices
        FROM invoices
        WHERE company_id = @companyId
      `);
    
    // Get transaction stats
    const transactionStats = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(amount) as total_amount,
          SUM(CASE WHEN is_matched = 1 THEN 1 ELSE 0 END) as matched_transactions,
          SUM(CASE WHEN is_matched = 0 THEN 1 ELSE 0 END) as unmatched_transactions
        FROM transactions
        WHERE company_id = @companyId
      `);
    
    // Get anomaly stats
    const anomalyStats = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT 
          COUNT(*) as total_anomalies,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_anomalies,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_anomalies
        FROM anomalies
        WHERE company_id = @companyId
      `);
    
    // Get match stats
    const matchStats = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT 
          COUNT(*) as total_matches,
          SUM(matched_amount) as total_matched_amount,
          AVG(match_confidence) as avg_confidence
        FROM invoice_transaction_matches m
        INNER JOIN invoices i ON m.invoice_id = i.id
        WHERE i.company_id = @companyId AND m.status = 'active'
      `);
    
    res.json({
      invoices: invoiceStats.recordset[0],
      transactions: transactionStats.recordset[0],
      anomalies: anomalyStats.recordset[0],
      matches: matchStats.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics', message: error.message });
  }
});

// GET reconciliation report
router.get('/reconciliation/company/:companyId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const pool = await getPool();
    const request = pool.request()
      .input('companyId', sql.BigInt, req.params.companyId);
    
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'AND i.invoice_date BETWEEN @startDate AND @endDate';
      request.input('startDate', sql.Date, startDate);
      request.input('endDate', sql.Date, endDate);
    }
    
    const result = await request.query(`
      SELECT 
        i.id as invoice_id,
        i.invoice_number,
        i.vendor_name,
        i.invoice_date,
        i.total_amount as invoice_amount,
        i.is_matched,
        m.id as match_id,
        m.matched_amount,
        m.match_confidence,
        t.id as transaction_id,
        t.transaction_date,
        t.description as transaction_description,
        t.amount as transaction_amount
      FROM invoices i
      LEFT JOIN invoice_transaction_matches m ON i.id = m.invoice_id AND m.status = 'active'
      LEFT JOIN transactions t ON m.transaction_id = t.id
      WHERE i.company_id = @companyId ${dateFilter}
      ORDER BY i.invoice_date DESC
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching reconciliation report:', error);
    res.status(500).json({ error: 'Failed to fetch reconciliation report', message: error.message });
  }
});

// GET export history
router.get('/exports/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT e.*, u.name as created_by_name
        FROM exports e
        LEFT JOIN users u ON e.created_by_user_id = u.id
        WHERE e.company_id = @companyId
        ORDER BY e.created_at DESC
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching exports:', error);
    res.status(500).json({ error: 'Failed to fetch exports', message: error.message });
  }
});

export default router;
