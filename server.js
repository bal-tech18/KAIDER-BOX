const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const MAX_STORAGE = 28 * 1024 ** 3; // 28GB
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Enable CORS
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'video/mp4', 'audio/mpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Middleware to check storage limit
app.use((req, res, next) => {
  const files = fs.readdirSync(UPLOAD_DIR);
  const totalSize = files.reduce((acc, file) => {
    const { size } = fs.statSync(path.join(UPLOAD_DIR, file));
    return acc + size;
  }, 0);

  if (totalSize >= MAX_STORAGE) {
    return res.status(403).send('Storage limit reached (28GB)');
  }
  next();
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send('File uploaded successfully');
});

// List files with size metadata
app.get('/files', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR).map(file => {
    const stats = fs.statSync(path.join(UPLOAD_DIR, file));
    return {
      name: file,
      size: stats.size
    };
  });
  res.json(files);
});

// Secure file download
app.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.download(filePath);
});

// Delete file endpoint
app.delete('/delete/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  fs.unlink(filePath, err => {
    if (err) return res.status(500).send('Error deleting file');
    res.send('File deleted successfully');
  });
});

// Storage usage endpoint
app.get('/storage-usage', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR);
  const totalSize = files.reduce((acc, file) => {
    const { size } = fs.statSync(path.join(UPLOAD_DIR, file));
    return acc + size;
  }, 0);

  res.json({
    used: totalSize,
    max: MAX_STORAGE
  });
});

// Start server
app.listen(PORT, '192.168.1.12', () => {
  console.log(`Server running at http://192.168.1.12:${PORT}`);
});
