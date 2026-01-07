import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// SQL Server configuration
const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 50115,
  database: process.env.DB_DATABASE || 'FP',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Add authentication based on configuration
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  // Windows Authentication
  config.authentication = {
    type: 'ntlm',
    options: {
      domain: '',
      userName: '',
      password: ''
    }
  };
  console.log('Using Windows Authentication');
} else {
  // SQL Server Authentication
  config.authentication = {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  };
  console.log('Using SQL Server Authentication');
}

// Connection pool
let pool = null;

/**
 * Get database connection pool
 * Creates a new pool if one doesn't exist
 */
export async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log('Database pool created');
    } catch (error) {
      console.error('Error creating database pool:', error);
      throw error;
    }
  }
  return pool;
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 as test');
    return result.recordset[0].test === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Execute a query
 * @param {string} query - SQL query string
 * @param {Object} params - Query parameters
 */
export async function executeQuery(query, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Add parameters to request
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

export default { getPool, executeQuery, testConnection, closeConnection };
