import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

const router = express.Router();

// GET all matches for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const { status } = req.query;
    
    let query = `
      SELECT 
        m.*,
        i.invoice_number, i.vendor_name, i.total_amount as invoice_amount,
        t.description as transaction_description, t.amount as transaction_amount,
        u.name as matched_by_name
      FROM invoice_transaction_matches m
      INNER JOIN invoices i ON m.invoice_id = i.id
      INNER JOIN transactions t ON m.transaction_id = t.id
      LEFT JOIN users u ON m.matched_by_user_id = u.id
      WHERE i.company_id = @companyId
    `;
    
    const request = pool.request().input('companyId', sql.BigInt, req.params.companyId);
    
    if (status) {
      query += ' AND m.status = @status';
      request.input('status', sql.VarChar(50), status);
    }
    
    query += ' ORDER BY m.created_at DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches', message: error.message });
  }
});

// GET match by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`
        SELECT 
          m.*,
          i.*, t.*
        FROM invoice_transaction_matches m
        INNER JOIN invoices i ON m.invoice_id = i.id
        INNER JOIN transactions t ON m.transaction_id = t.id
        WHERE m.id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match', message: error.message });
  }
});

// POST create new match
router.post('/', async (req, res) => {
  try {
    const {
      invoice_id, transaction_id, match_type, matched_amount,
      match_method, match_confidence, match_reason, matched_by_user_id
    } = req.body;
    
    if (!invoice_id || !transaction_id || !matched_amount || !match_method || !matched_by_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const pool = await getPool();
    const transaction = pool.transaction();
    
    try {
      await transaction.begin();
      
      // Create match
      const matchResult = await transaction.request()
        .input('invoice_id', sql.BigInt, invoice_id)
        .input('transaction_id', sql.BigInt, transaction_id)
        .input('match_type', sql.VarChar(50), match_type || 'full')
        .input('matched_amount', sql.Decimal(15, 2), matched_amount)
        .input('match_method', sql.VarChar(50), match_method)
        .input('match_confidence', sql.Decimal(5, 4), match_confidence)
        .input('match_reason', sql.VarChar(sql.MAX), match_reason)
        .input('matched_by_user_id', sql.BigInt, matched_by_user_id)
        .query(`
          INSERT INTO invoice_transaction_matches (
            invoice_id, transaction_id, match_type, matched_amount,
            match_method, match_confidence, match_reason, matched_by_user_id
          )
          OUTPUT INSERTED.*
          VALUES (
            @invoice_id, @transaction_id, @match_type, @matched_amount,
            @match_method, @match_confidence, @match_reason, @matched_by_user_id
          )
        `);
      
      // Update invoice and transaction matched status
      await transaction.request()
        .input('invoice_id', sql.BigInt, invoice_id)
        .query('UPDATE invoices SET is_matched = 1, status = \'matched\' WHERE id = @invoice_id');
      
      await transaction.request()
        .input('transaction_id', sql.BigInt, transaction_id)
        .query('UPDATE transactions SET is_matched = 1 WHERE id = @transaction_id');
      
      await transaction.commit();
      res.status(201).json(matchResult.recordset[0]);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match', message: error.message });
  }
});

// DELETE unmatch (cancel match)
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const transaction = pool.transaction();
    
    try {
      await transaction.begin();
      
      // Get match details
      const matchResult = await transaction.request()
        .input('id', sql.BigInt, req.params.id)
        .query('SELECT invoice_id, transaction_id FROM invoice_transaction_matches WHERE id = @id');
      
      if (matchResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Match not found' });
      }
      
      const { invoice_id, transaction_id } = matchResult.recordset[0];
      
      // Delete match
      await transaction.request()
        .input('id', sql.BigInt, req.params.id)
        .query('DELETE FROM invoice_transaction_matches WHERE id = @id');
      
      // Update invoice and transaction
      await transaction.request()
        .input('invoice_id', sql.BigInt, invoice_id)
        .query('UPDATE invoices SET is_matched = 0, status = \'processed\' WHERE id = @invoice_id');
      
      await transaction.request()
        .input('transaction_id', sql.BigInt, transaction_id)
        .query('UPDATE transactions SET is_matched = 0 WHERE id = @transaction_id');
      
      await transaction.commit();
      res.json({ message: 'Match deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match', message: error.message });
  }
});

// GET suggested matches for an invoice
router.get('/suggestions/invoice/:invoiceId', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('invoiceId', sql.BigInt, req.params.invoiceId)
      .query(`
        SELECT 
          t.*,
          i.total_amount as invoice_amount,
          ABS(t.amount - i.total_amount) as amount_diff
        FROM transactions t
        CROSS JOIN invoices i
        WHERE i.id = @invoiceId
          AND t.company_id = i.company_id
          AND t.is_matched = 0
          AND ABS(t.amount - i.total_amount) < 10
        ORDER BY amount_diff ASC, t.transaction_date DESC
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching match suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch match suggestions', message: error.message });
  }
});

export default router;
