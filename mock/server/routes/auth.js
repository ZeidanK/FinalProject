import express from 'express';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, company } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    // Validate role
    const validRoles = ['admin', 'accountant', 'business-owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: admin, accountant, or business-owner' });
    }

    const pool = await getPool();
    
    // Check if user already exists
    const existingUser = await pool.request()
      .input('email', sql.VarChar(255), email)
      .query('SELECT id FROM users WHERE email = @email');
    
    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await pool.request()
      .input('email', sql.VarChar(255), email)
      .input('password_hash', sql.VarChar(255), password_hash)
      .input('name', sql.VarChar(255), name)
      .input('role', sql.VarChar(50), role)
      .input('phone', sql.VarChar(20), null)
      .query(`
        INSERT INTO users (email, password_hash, name, role, phone, is_active, email_verified)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.role, INSERTED.created_at
        VALUES (@email, @password_hash, @name, @role, @phone, 1, 0)
      `);
    
    const user = result.recordset[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user', message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pool = await getPool();
    
    // Find user by email
    const result = await pool.request()
      .input('email', sql.VarChar(255), email)
      .query('SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.recordset[0];
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled. Please contact support.' });
    }

    // If role is specified, verify it matches
    if (role && user.role !== role) {
      return res.status(401).json({ error: `This account is not registered as a ${role}` });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await pool.request()
      .input('id', sql.BigInt, user.id)
      .query('UPDATE users SET last_login_at = GETDATE() WHERE id = @id');
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
});

// Get current user (requires authentication)
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production');
    
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, decoded.userId)
      .query('SELECT id, email, name, role, phone, profile_picture, is_active, email_verified, last_login_at, created_at FROM users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

export default router;
