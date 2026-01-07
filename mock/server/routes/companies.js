import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

const router = express.Router();

// GET all companies
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT c.*, u.name as created_by_name 
        FROM companies c
        LEFT JOIN users u ON c.created_by_user_id = u.id
        WHERE c.is_active = 1
        ORDER BY c.created_at DESC
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies', message: error.message });
  }
});

// GET company by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT * FROM companies WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company', message: error.message });
  }
});

// POST create new company
router.post('/', async (req, res) => {
  try {
    const {
      name, registration_number, street, city, state, postal_code, country,
      email, phone, website, tax_id, vat_number, fiscal_year_start,
      currency, created_by_user_id
    } = req.body;
    
    if (!name || !created_by_user_id) {
      return res.status(400).json({ error: 'Name and created_by_user_id are required' });
    }
    
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(255), name)
      .input('registration_number', sql.VarChar(100), registration_number)
      .input('street', sql.VarChar(sql.MAX), street)
      .input('city', sql.VarChar(100), city)
      .input('state', sql.VarChar(100), state)
      .input('postal_code', sql.VarChar(20), postal_code)
      .input('country', sql.VarChar(100), country || 'USA')
      .input('email', sql.VarChar(255), email)
      .input('phone', sql.VarChar(50), phone)
      .input('website', sql.VarChar(255), website)
      .input('tax_id', sql.VarChar(100), tax_id)
      .input('vat_number', sql.VarChar(100), vat_number)
      .input('fiscal_year_start', sql.Date, fiscal_year_start)
      .input('currency', sql.VarChar(3), currency || 'USD')
      .input('created_by_user_id', sql.BigInt, created_by_user_id)
      .query(`
        INSERT INTO companies (
          name, registration_number, street, city, state, postal_code, country,
          email, phone, website, tax_id, vat_number, fiscal_year_start,
          currency, created_by_user_id
        )
        OUTPUT INSERTED.*
        VALUES (
          @name, @registration_number, @street, @city, @state, @postal_code, @country,
          @email, @phone, @website, @tax_id, @vat_number, @fiscal_year_start,
          @currency, @created_by_user_id
        )
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company', message: error.message });
  }
});

// PUT update company
router.put('/:id', async (req, res) => {
  try {
    const {
      name, street, city, state, postal_code, country,
      email, phone, website, tax_id, vat_number, is_active
    } = req.body;
    
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('name', sql.VarChar(255), name)
      .input('street', sql.VarChar(sql.MAX), street)
      .input('city', sql.VarChar(100), city)
      .input('state', sql.VarChar(100), state)
      .input('postal_code', sql.VarChar(20), postal_code)
      .input('country', sql.VarChar(100), country)
      .input('email', sql.VarChar(255), email)
      .input('phone', sql.VarChar(50), phone)
      .input('website', sql.VarChar(255), website)
      .input('tax_id', sql.VarChar(100), tax_id)
      .input('vat_number', sql.VarChar(100), vat_number)
      .input('is_active', sql.Bit, is_active)
      .query(`
        UPDATE companies
        SET name = @name,
            street = @street,
            city = @city,
            state = @state,
            postal_code = @postal_code,
            country = @country,
            email = @email,
            phone = @phone,
            website = @website,
            tax_id = @tax_id,
            vat_number = @vat_number,
            is_active = @is_active,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company', message: error.message });
  }
});

// GET companies for a user (multi-tenant access)
router.get('/user/:userId', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.BigInt, req.params.userId)
      .query(`
        SELECT c.*, uca.access_level, uca.status as access_status
        FROM companies c
        INNER JOIN user_company_access uca ON c.id = uca.company_id
        WHERE uca.user_id = @userId AND uca.status = 'active'
        ORDER BY c.name
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching user companies:', error);
    res.status(500).json({ error: 'Failed to fetch user companies', message: error.message });
  }
});

export default router;
