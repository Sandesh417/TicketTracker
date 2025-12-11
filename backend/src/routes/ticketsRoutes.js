const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ticketController = require('../controllers/ticketController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); 

const router = express.Router();

const createStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../uploads/temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// Storage for attaching files to existing ticket
const attachStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../uploads', req.params.ticketNumber);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// Storage for comment attachments
const commentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../uploads/comments', req.params.ticketNumber);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter for all uploads
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
  }
};

// Multer upload instances
const createUpload = multer({
  storage: createStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

const attachUpload = multer({
  storage: attachStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

const commentUpload = multer({
  storage: commentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ==================== NORMALIZATION MIDDLEWARE ====================

function normalizeTicketData(req, res, next) {
  console.log('=== NORMALIZING REQUEST DATA ===');
  
  // Normalize optional string fields
  if (req.body.mobileNumber !== undefined) {
    const val = req.body.mobileNumber;
    req.body.mobileNumber = (val === '' || val === 'null' || !val) ? null : val.trim();
  }
  
  // Normalize optional number fields
  if (req.body.shopId !== undefined) {
    const val = req.body.shopId;
    req.body.shopId = (val === '' || val === 'null' || !val) ? null : Number(val);
  }
  
  if (req.body.lineId !== undefined) {
    const val = req.body.lineId;
    req.body.lineId = (val === '' || val === 'null' || !val) ? null : Number(val);
  }
  
  if (req.body.machine !== undefined) {
    const val = req.body.machine;
    req.body.machine = (val === '' || val === 'null' || !val) ? null : val.trim();
  }
  
  if (req.body.drfLink !== undefined) {
    const val = req.body.drfLink;
    req.body.drfLink = (val === '' || val === 'null' || !val) ? '' : val.trim();
  }
  
  if (req.body.azureLink !== undefined) {
    const val = req.body.azureLink;
    req.body.azureLink = (val === '' || val === 'null' || !val) ? '' : val.trim();
  }
  
  console.log('Normalized data:', req.body);
  console.log('================================\n');
  next();
}

// ==================== PUBLIC ROUTES ====================

// Create ticket (public - no auth required)
router.post('/', createUpload.array('attachments', 5), normalizeTicketData, ticketController.createTicket);

// Upload attachments to existing ticket (public)
router.post('/:ticketNumber/attachments', attachUpload.array('attachments', 5), ticketController.uploadAttachments);

// ==================== PROTECTED ROUTES (Require Authentication) ====================

router.use(authenticateToken); // All routes below require authentication

// Get all tickets
router.get('/', ticketController.getTickets);

// Get single ticket
router.get('/:ticketNumber', ticketController.getSingleTicket);

// Update ticket
router.put('/:ticketNumber', normalizeTicketData, ticketController.updateTicket);

// Delete ticket (Admin only)
router.delete('/:ticketNumber', authorizeRoles('Admin'), ticketController.deleteTicket);

// ==================== HISTORY & COMMENTS ROUTES ====================

// Get ticket history
router.get('/:ticketNumber/history', ticketController.getTicketHistory);

// Add comment with attachments
router.post('/:ticketNumber/comments', commentUpload.array('attachments', 5), ticketController.addHistoryComment);

// Alternative route for adding comment (backward compatibility)
router.post('/:ticketNumber/history', commentUpload.array('attachments', 5), ticketController.addHistoryComment);

// Edit comment
router.put('/:ticketNumber/history/:commentId', ticketController.editHistoryComment);

// Delete comment
router.delete('/:ticketNumber/history/:commentId', ticketController.deleteHistoryComment);

// ==================== TICKET MANAGEMENT ROUTES ====================

// Update remark
router.put('/:ticketNumber/remark', ticketController.updateRemark);

// Assign ticket to developer (Admin only)
router.post('/:ticketNumber/assign', authorizeRoles('Admin'), ticketController.assignTicket);

// Update ticket status
router.put('/:ticketNumber/status', normalizeTicketData, ticketController.updateTicket);

// Close ticket (Admin only)
router.post('/:ticketNumber/close', authorizeRoles('Admin'), ticketController.closeTicket);

// ==================== FILE DOWNLOAD ROUTES ====================

// Get ticket attachments list
router.get('/:ticketNumber/attachments', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const Ticket = require('../models/Ticket');
    const ticket = await Ticket.getByTicketNumber(ticketNumber);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({
      success: true,
      data: ticket.attachments || []
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Download specific attachment
router.get('/:ticketNumber/attachments/:filename', async (req, res) => {
  try {
    const { ticketNumber, filename } = req.params;
    const filePath = path.resolve(__dirname, '../uploads', ticketNumber, filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Download comment attachment
router.get('/:ticketNumber/comments/:filename', async (req, res) => {
  try {
    const { ticketNumber, filename } = req.params;
    const filePath = path.resolve(__dirname, '../uploads/comments', ticketNumber, filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error downloading comment file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

module.exports = router;
