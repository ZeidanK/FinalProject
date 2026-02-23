import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin role
router.use(requireRole('admin'));

// GET system-wide stats
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_active = 1)                          AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'accountant' AND is_active = 1)  AS total_accountants,
        (SELECT COUNT(*) FROM users WHERE role = 'business_owner' AND is_active = 1) AS total_business_owners,
        (SELECT COUNT(*) FROM companies WHERE is_active = 1)                      AS total_companies,
        (SELECT COUNT(*) FROM invoices)                                            AS total_invoices,
        (SELECT COUNT(*) FROM transactions)                                        AS total_transactions,
        (SELECT COUNT(*) FROM invoice_transaction_matches WHERE status = 'active') AS total_matches,
        (SELECT COUNT(*) FROM anomalies WHERE status = 'open')                    AS open_anomalies
    `);
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// GET all users (paginated)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const pool = await getPool();
    const request = pool.request()
      .input('limit', sql.Int, parseInt(limit))
      .input('offset', sql.Int, offset);

    let where = 'WHERE 1=1';
    if (role) {
      where += ' AND role = @role';
      request.input('role', sql.VarChar(50), role);
    }
    if (search) {
      where += ' AND (name LIKE @search OR email LIKE @search)';
      request.input('search', sql.VarChar(255), `%${search}%`);
    }

    const result = await request.query(`
      SELECT id, email, name, role, phone, is_active, email_verified, last_login_at, created_at
      FROM users
      ${where}
      ORDER BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countResult = await pool.request().query(`SELECT COUNT(*) AS total FROM users ${where}`);

    res.json({
      users: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// PUT toggle user active status
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`
        UPDATE users
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = GETDATE()
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.role, INSERTED.is_active
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to toggle user status', message: error.message });
  }
});

// GET system logs (paginated)
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 100, level, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const pool = await getPool();
    const request = pool.request()
      .input('limit', sql.Int, parseInt(limit))
      .input('offset', sql.Int, offset);

    let where = 'WHERE 1=1';
    if (level) {
      where += ' AND log_level = @level';
      request.input('level', sql.VarChar(50), level);
    }
    if (category) {
      where += ' AND category = @category';
      request.input('category', sql.VarChar(50), category);
    }

    const result = await request.query(`
      SELECT sl.*, u.name as user_name, c.name as company_name
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN companies c ON sl.company_id = c.id
      ${where}
      ORDER BY sl.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs', message: error.message });
  }
});

// GET audit logs (paginated)
router.get('/audit', async (req, res) => {
  try {
    const { page = 1, limit = 100, companyId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const pool = await getPool();
    const request = pool.request()
      .input('limit', sql.Int, parseInt(limit))
      .input('offset', sql.Int, offset);

    let where = 'WHERE 1=1';
    if (companyId) {
      where += ' AND al.company_id = @companyId';
      request.input('companyId', sql.BigInt, companyId);
    }

    const result = await request.query(`
      SELECT al.*, u.name as user_name, c.name as company_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN companies c ON al.company_id = c.id
      ${where}
      ORDER BY al.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

export default router;
