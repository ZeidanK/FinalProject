import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

const router = express.Router();

// GET all bank accounts for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('companyId', sql.BigInt, req.params.companyId)
      .query(`
        SELECT ba.*, u.name as created_by_name
        FROM bank_accounts ba
        LEFT JOIN users u ON ba.created_by_user_id = u.id
        WHERE ba.company_id = @companyId
        ORDER BY ba.bank_name ASC
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts', message: error.message });
  }
});

// GET bank account by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT * FROM bank_accounts WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ error: 'Failed to fetch bank account', message: error.message });
  }
});

// POST create bank account
router.post('/', async (req, res) => {
  try {
    const {
      company_id, bank_name, account_name, account_number_masked,
      account_type, currency, balance
    } = req.body;

    if (!company_id || !bank_name || !account_type) {
      return res.status(400).json({ error: 'company_id, bank_name, and account_type are required' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('company_id', sql.BigInt, company_id)
      .input('bank_name', sql.VarChar(255), bank_name)
      .input('account_name', sql.VarChar(255), account_name || null)
      .input('account_number_masked', sql.VarChar(50), account_number_masked || null)
      .input('account_type', sql.VarChar(50), account_type)
      .input('currency', sql.VarChar(3), currency || 'USD')
      .input('balance', sql.Decimal(15, 2), balance || null)
      .input('created_by_user_id', sql.BigInt, req.user.userId)
      .query(`
        INSERT INTO bank_accounts (
          company_id, bank_name, account_name, account_number_masked,
          account_type, currency, balance, created_by_user_id
        )
        OUTPUT INSERTED.*
        VALUES (
          @company_id, @bank_name, @account_name, @account_number_masked,
          @account_type, @currency, @balance, @created_by_user_id
        )
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ error: 'Failed to create bank account', message: error.message });
  }
});

// PUT update bank account
router.put('/:id', async (req, res) => {
  try {
    const { bank_name, account_name, account_number_masked, account_type, currency, is_active, balance, last_sync_at } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('bank_name', sql.VarChar(255), bank_name)
      .input('account_name', sql.VarChar(255), account_name || null)
      .input('account_number_masked', sql.VarChar(50), account_number_masked || null)
      .input('account_type', sql.VarChar(50), account_type)
      .input('currency', sql.VarChar(3), currency || 'USD')
      .input('is_active', sql.Bit, is_active !== undefined ? (is_active ? 1 : 0) : 1)
      .input('balance', sql.Decimal(15, 2), balance || null)
      .input('last_sync_at', sql.DateTime2, last_sync_at || null)
      .query(`
        UPDATE bank_accounts
        SET bank_name = @bank_name,
            account_name = @account_name,
            account_number_masked = @account_number_masked,
            account_type = @account_type,
            currency = @currency,
            is_active = @is_active,
            balance = @balance,
            last_sync_at = @last_sync_at,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ error: 'Failed to update bank account', message: error.message });
  }
});

// DELETE bank account (soft delete via is_active)
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`
        UPDATE bank_accounts SET is_active = 0, updated_at = GETDATE()
        OUTPUT INSERTED.id
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    res.json({ message: 'Bank account deactivated successfully' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ error: 'Failed to delete bank account', message: error.message });
  }
});

export default router;
