const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await db.testConnection();
  res.json({ 
    status: 'ok', 
    service: 'backend', 
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date() 
  });
});

// Get all invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, filename, file_size, mime_type, processing_time, created_at FROM invoices ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ success: true, invoices: result.rows });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoice by ID
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM invoices WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ success: true, invoice: result.rows[0] });
  } catSave to database
    let invoiceId = null;
    try {
      const dbResult = await db.query(
        'INSERT INTO invoices (filename, file_size, mime_type, extracted_text, processing_time, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [req.file.originalname, req.file.size, req.file.mimetype, aiResponse.data.text, processingTime, 1]
      );
      invoiceId = dbResult.rows[0].id;
      console.log(`💾 Saved to database with ID: ${invoiceId}`);
    } catch (dbError) {
      console.error('⚠️  Database save failed:', dbError.message);
      // Continue anyway - don't fail the request if DB is down
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return results
    res.json({
      success: true,
      invoiceId: invoiceId
// Upload and process endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📁 File received: ${req.file.originalname} (${req.file.size} bytes)`);

    // Read file as base64 for sending to AI service
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileBase64 = fileBuffer.toString('base64');

    console.log('🤖 Calling AI service for OCR extraction...');

    // Call AI service
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/extract`, {
      file_data: fileBase64,
      filename: req.file.originalname,
      mimetype: req.file.mimetype
    }, {
      timeout: 30000 // 30 second timeout
    });

    const processingTime = Date.now() - startTime;

    console.log(`✅ OCR complete in ${processingTime}ms`);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return results
    res.json({
      success: true,
      filename: req.file.originalname,
      processingTime: processingTime,
      extractedText: aiResponse.data.text,
      metadata: {
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        textLength: aiResponse.data.text?.length || 0,
        confidence: aiResponse.data.confidence || null
      }
    });

  } catch (error) {
    console.error('❌ Error processing upload:', error.message);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Handle different error types
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI service is not available. Make sure it is running.'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.detail || 'AI service error'
      });
    }

    res.status(500).json({
      error: 'Failed to process file',
      details: error.message
    });
  }
});async () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🤖 AI Service URL: ${AI_SERVICE_URL}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  
  // Test database connection
  await db.testConnection(
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🤖 AI Service URL: ${AI_SERVICE_URL}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
