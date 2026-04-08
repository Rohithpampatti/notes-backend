const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');
const noteController = require('../controllers/notecontroller');
const aiController = require('../controllers/aiController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Note CRUD routes
router.post('/', noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

// Sharing routes
router.post('/:id/share', noteController.shareNote);
router.post('/:id/public', noteController.createPublicLink);
router.get('/public/:publicId', noteController.getPublicNote);

// Reminder route
router.post('/:id/reminder', noteController.updateReminder);

// AI routes
router.post('/ai/summarize', aiController.summarizeNote);
router.post('/ai/suggest-title', aiController.suggestTitle);
router.post('/ai/extract-tags', aiController.extractTags);
router.post('/ai/analyze-all', aiController.analyzeAllNotes);
// Privacy password routes
router.post('/privacy/set-password', noteController.setPrivacyPassword);
router.post('/privacy/verify-password', noteController.verifyPrivacyPassword);
router.get('/privacy/has-password', noteController.hasPrivacyPassword); EXISTS

module.exports = router;