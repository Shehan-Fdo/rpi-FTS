const express = require('express');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const ip = require('ip');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Append timestamp to ensure unique filenames (fixes iOS multiple upload issues)
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniquePrefix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes

// Get server info (IP, QR Code)
app.get('/server-info', (req, res) => {
    const localIp = ip.address();
    const url = `http://${localIp}:${PORT}`;
    QRCode.toDataURL(url, (err, qrCodeUrl) => {
        if (err) return res.status(500).json({ error: 'Failed to generate QR code' });
        res.json({ url, qrCodeUrl });
    });
});

// Get list of files
app.get('/files', (req, res) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to list files' });
        }
        const fileInfos = files.map(file => {
            try {
                const stats = fs.statSync(path.join(UPLOADS_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    mtime: stats.mtime
                };
            } catch (e) {
                return null;
            }
        }).filter(f => f !== null);
        res.json(fileInfos);
    });
});

// Upload file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Broadcast new file to all clients
    io.emit('file_uploaded', {
        name: req.file.filename,
        size: req.file.size,
        mtime: new Date()
    });
    res.json({ message: 'File uploaded successfully' });
});

// Download file
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start server
server.listen(PORT, () => {
    const localIp = ip.address();
    const url = `http://${localIp}:${PORT}`;
    console.log(`Server running at ${url}`);

    // Print QR Code to terminal for convenience
    QRCode.toString(url, { type: 'terminal' }, (err, str) => {
        if (!err) console.log(str);
    });
});
