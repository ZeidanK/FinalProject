import express from 'express';
import sql from 'mssql';
import { getPool } from '../config/database.js';

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT id, email, name, role, phone, is_active, email_verified, last_login_at, created_at FROM users ORDER BY created_at DESC');
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT id, email, name, role, phone, profile_picture, is_active, email_verified, email_verified_at, last_login_at, created_at, updated_at FROM users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const { email, password_hash, name, role, phone } = req.body;
    
    if (!email || !password_hash || !name) {
      return res.status(400).json({ error: 'Email, password_hash, and name are required' });
    }
    
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.VarChar(255), email)
      .input('password_hash', sql.VarChar(255), password_hash)
      .input('name', sql.VarChar(255), name)
      .input('role', sql.VarChar(50), role || 'business_owner')
      .input('phone', sql.VarChar(50), phone || null)
      .query(`
        INSERT INTO users (email, password_hash, name, role, phone)
        OUTPUT INSERTED.*
        VALUES (@email, @password_hash, @name, @role, @phone)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.number === 2627) { // Unique constraint violation
      res.status(409).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, profile_picture, is_active } = req.body;
    
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('name', sql.VarChar(255), name)
      .input('phone', sql.VarChar(50), phone)
      .input('profile_picture', sql.VarChar(500), profile_picture)
      .input('is_active', sql.Bit, is_active)
      .query(`
        UPDATE users
        SET name = @name,
            phone = @phone,
            profile_picture = @profile_picture,
            is_active = @is_active,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('DELETE FROM users WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

export default router;
