const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'deploytest',
  user: process.env.DB_USER || 'deployuser',
  password: process.env.DB_PASSWORD || 'deploypass',
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

// Helper function to test connection
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🗄️  Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Query helper with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
