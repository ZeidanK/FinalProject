import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setResult(null)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use relative URL for production (nginx proxy), absolute for dev
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3000/api/upload'
        : '/api/upload';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <div className="container">
        <h1>📄 AI Invoice OCR Demo</h1>
        <p className="subtitle">Upload a document to extract text using OCR</p>

        <div className="upload-section">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            disabled={loading}
          />
          <button onClick={handleUpload} disabled={!file || loading}>
            {loading ? '⏳ Processing...' : '🚀 Upload & Extract'}
          </button>
        </div>

        {file && (
          <div className="file-info">
            <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        {error && (
          <div className="error">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="result">
            <h2>✅ Extraction Complete</h2>
            
            <div className="result-section">
              <h3>📊 OCR Results</h3>
              <div className="result-data">
                <p><strong>Status:</strong> {result.success ? 'Success' : 'Failed'}</p>
                <p><strong>Processing Time:</strong> {result.processingTime}ms</p>
                <p><strong>Text Length:</strong> {result.extractedText?.length || 0} characters</p>
              </div>
            </div>

            <div className="result-section">
              <h3>📝 Extracted Text</h3>
              <pre className="extracted-text">{result.extractedText || 'No text extracted'}</pre>
            </div>

            {result.metadata && (
              <div className="result-section">
                <h3>🔍 Metadata</h3>
                <pre className="metadata">{JSON.stringify(result.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        <div className="footer">
          <p>Stack Test: React + Node.js + Python FastAPI + Docker</p>
        </div>
      </div>
    </div>
  )
}

export default App
