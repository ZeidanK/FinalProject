import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';
import { requireAuth } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import companiesRoutes from './routes/companies.js';
import invoicesRoutes from './routes/invoices.js';
import transactionsRoutes from './routes/transactions.js';
import matchesRoutes from './routes/matches.js';
import anomaliesRoutes from './routes/anomalies.js';
import reportsRoutes from './routes/reports.js';
import bankAccountsRoutes from './routes/bankAccounts.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (public)
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ── Public routes (no auth required) ──────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Protected routes (JWT required) ───────────────────────────────────────
app.use('/api', requireAuth);

app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/bank-accounts', bankAccountsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
  
  // Test database connection
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Database connected successfully');
    } else {
      console.log('⚠️  Database connection failed - check configuration');
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
});

export default app;
