import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

const router = express.Router();

// GET all transactions for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const pool = await getPool();
    const { startDate, endDate, type, matched } = req.query;
    
    let query = `
      SELECT t.*, u.name as created_by_name
      FROM transactions t
      LEFT JOIN users u ON t.created_by_user_id = u.id
      WHERE t.company_id = @companyId
    `;
    
    const request = pool.request().input('companyId', sql.BigInt, req.params.companyId);
    
    if (type) {
      query += ' AND t.transaction_type = @type';
      request.input('type', sql.VarChar(50), type);
    }
    
    if (matched !== undefined) {
      query += ' AND t.is_matched = @matched';
      request.input('matched', sql.Bit, matched === 'true' ? 1 : 0);
    }
    
    if (startDate && endDate) {
      query += ' AND t.transaction_date BETWEEN @startDate AND @endDate';
      request.input('startDate', sql.Date, startDate);
      request.input('endDate', sql.Date, endDate);
    }
    
    query += ' ORDER BY t.transaction_date DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions', message: error.message });
  }
});

// GET transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT * FROM transactions WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction', message: error.message });
  }
});

// POST create new transaction
router.post('/', async (req, res) => {
  try {
    const {
      company_id, bank_account_id, transaction_date, posted_date,
      description, amount, balance_after, transaction_type,
      category, reference_number, created_by_user_id
    } = req.body;
    
    if (!company_id || !bank_account_id || !transaction_date || !description || !amount || !transaction_type || !created_by_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const pool = await getPool();
    const result = await pool.request()
      .input('company_id', sql.BigInt, company_id)
      .input('bank_account_id', sql.BigInt, bank_account_id)
      .input('transaction_date', sql.Date, transaction_date)
      .input('posted_date', sql.Date, posted_date)
      .input('description', sql.VarChar(sql.MAX), description)
      .input('amount', sql.Decimal(15, 2), amount)
      .input('balance_after', sql.Decimal(15, 2), balance_after)
      .input('transaction_type', sql.VarChar(50), transaction_type)
      .input('category', sql.VarChar(100), category)
      .input('reference_number', sql.VarChar(100), reference_number)
      .input('created_by_user_id', sql.BigInt, created_by_user_id)
      .query(`
        INSERT INTO transactions (
          company_id, bank_account_id, transaction_date, posted_date,
          description, amount, balance_after, transaction_type,
          category, reference_number, created_by_user_id
        )
        OUTPUT INSERTED.*
        VALUES (
          @company_id, @bank_account_id, @transaction_date, @posted_date,
          @description, @amount, @balance_after, @transaction_type,
          @category, @reference_number, @created_by_user_id
        )
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction', message: error.message });
  }
});

// POST bulk import transactions
router.post('/bulk', async (req, res) => {
  try {
    const { company_id, transactions, created_by_user_id } = req.body;
    
    if (!company_id || !transactions || !Array.isArray(transactions) || !created_by_user_id) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    const pool = await getPool();
    const transaction = pool.transaction();
    const inserted = [];
    
    try {
      await transaction.begin();
      
      for (const txn of transactions) {
        const result = await transaction.request()
          .input('company_id', sql.BigInt, company_id)
          .input('bank_account_id', sql.BigInt, txn.bank_account_id)
          .input('transaction_date', sql.Date, txn.transaction_date)
          .input('posted_date', sql.Date, txn.posted_date)
          .input('description', sql.VarChar(sql.MAX), txn.description)
          .input('amount', sql.Decimal(15, 2), txn.amount)
          .input('balance_after', sql.Decimal(15, 2), txn.balance_after)
          .input('transaction_type', sql.VarChar(50), txn.transaction_type)
          .input('category', sql.VarChar(100), txn.category)
          .input('reference_number', sql.VarChar(100), txn.reference_number)
          .input('created_by_user_id', sql.BigInt, created_by_user_id)
          .query(`
            INSERT INTO transactions (
              company_id, bank_account_id, transaction_date, posted_date,
              description, amount, balance_after, transaction_type,
              category, reference_number, created_by_user_id
            )
            OUTPUT INSERTED.id
            VALUES (
              @company_id, @bank_account_id, @transaction_date, @posted_date,
              @description, @amount, @balance_after, @transaction_type,
              @category, @reference_number, @created_by_user_id
            )
          `);
        
        inserted.push(result.recordset[0].id);
      }
      
      await transaction.commit();
      res.status(201).json({ message: `Successfully imported ${inserted.length} transactions`, ids: inserted });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error bulk importing transactions:', error);
    res.status(500).json({ error: 'Failed to import transactions', message: error.message });
  }
});

export default router;
