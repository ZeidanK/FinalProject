import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

const router = express.Router();

// GET all anomalies for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const { status, severity, type } = req.query;
    
    let query = `
      SELECT a.*, u.name as resolved_by_name
      FROM anomalies a
      LEFT JOIN users u ON a.resolved_by_user_id = u.id
      WHERE a.company_id = @companyId
    `;
    
    const request = pool.request().input('companyId', sql.BigInt, req.params.companyId);
    
    if (status) {
      query += ' AND a.status = @status';
      request.input('status', sql.VarChar(50), status);
    }
    
    if (severity) {
      query += ' AND a.severity = @severity';
      request.input('severity', sql.VarChar(50), severity);
    }
    
    if (type) {
      query += ' AND a.anomaly_type = @type';
      request.input('type', sql.VarChar(50), type);
    }
    
    query += ' ORDER BY a.severity DESC, a.created_at DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies', message: error.message });
  }
});

// GET anomaly by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT * FROM anomalies WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching anomaly:', error);
    res.status(500).json({ error: 'Failed to fetch anomaly', message: error.message });
  }
});

// POST create new anomaly
router.post('/', async (req, res) => {
  try {
    const {
      company_id, anomaly_type, severity, title, description,
      suggested_action, related_invoice_id, related_transaction_id,
      related_match_id, amount, detection_method, detection_confidence
    } = req.body;
    
    if (!company_id || !anomaly_type || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const pool = await getPool();
    const result = await pool.request()
      .input('company_id', sql.BigInt, company_id)
      .input('anomaly_type', sql.VarChar(50), anomaly_type)
      .input('severity', sql.VarChar(50), severity || 'warning')
      .input('title', sql.VarChar(255), title)
      .input('description', sql.VarChar(sql.MAX), description)
      .input('suggested_action', sql.VarChar(sql.MAX), suggested_action)
      .input('related_invoice_id', sql.BigInt, related_invoice_id)
      .input('related_transaction_id', sql.BigInt, related_transaction_id)
      .input('related_match_id', sql.BigInt, related_match_id)
      .input('amount', sql.Decimal(15, 2), amount)
      .input('detection_method', sql.VarChar(50), detection_method || 'ai')
      .input('detection_confidence', sql.Decimal(5, 4), detection_confidence)
      .query(`
        INSERT INTO anomalies (
          company_id, anomaly_type, severity, title, description,
          suggested_action, related_invoice_id, related_transaction_id,
          related_match_id, amount, detection_method, detection_confidence
        )
        OUTPUT INSERTED.*
        VALUES (
          @company_id, @anomaly_type, @severity, @title, @description,
          @suggested_action, @related_invoice_id, @related_transaction_id,
          @related_match_id, @amount, @detection_method, @detection_confidence
        )
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating anomaly:', error);
    res.status(500).json({ error: 'Failed to create anomaly', message: error.message });
  }
});

// PUT resolve anomaly
router.put('/:id/resolve', async (req, res) => {
  try {
    const { resolved_by_user_id, resolution_notes, status } = req.body;
    
    if (!resolved_by_user_id) {
      return res.status(400).json({ error: 'resolved_by_user_id is required' });
    }
    
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('status', sql.VarChar(50), status || 'resolved')
      .input('resolved_by_user_id', sql.BigInt, resolved_by_user_id)
      .input('resolution_notes', sql.VarChar(sql.MAX), resolution_notes)
      .query(`
        UPDATE anomalies
        SET status = @status,
            resolved_by_user_id = @resolved_by_user_id,
            resolved_at = GETDATE(),
            resolution_notes = @resolution_notes,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error resolving anomaly:', error);
    res.status(500).json({ error: 'Failed to resolve anomaly', message: error.message });
  }
});

// GET anomaly statistics for dashboard
router.get('/stats/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'investigating' THEN 1 ELSE 0 END) as investigating,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning,
          SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info
        FROM anomalies
        WHERE company_id = @companyId
      `);
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching anomaly stats:', error);
    res.status(500).json({ error: 'Failed to fetch anomaly statistics', message: error.message });
  }
});

export default router;
