const Note = require('../models/note');
const { v4: uuidv4 } = require('uuid');

// Create a new note
const createNote = async (req, res) => {
    try {
        const { title, content, tags, reminder, reminderDate } = req.body;
        const userId = req.user.id;

        const note = new Note({
            title,
            content,
            userId,
            tags: tags || [],
            reminder: reminder || false,
            reminderDate: reminderDate || null,
            reminderNotified: false
        });

        await note.save();
        res.status(201).json(note);
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
};

// Get all notes for a user
const getNotes = async (req, res) => {
    try {
        const userId = req.user.id;

        const notes = await Note.find({
            $or: [
                { userId },
                { 'sharedWith.email': req.user.email }
            ]
        }).sort({ updatedAt: -1 });

        res.json(notes);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
};

// Get single note by ID
const getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userEmail = req.user.email;

        const note = await Note.findOne({
            _id: id,
            $or: [
                { userId },
                { 'sharedWith.email': userEmail }
            ]
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json(note);
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
};

// Update a note
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userEmail = req.user.email;
        const { title, content, tags, reminder, reminderDate } = req.body;

        const note = await Note.findOne({
            _id: id,
            $or: [
                { userId },
                {
                    'sharedWith': {
                        $elemMatch: {
                            email: userEmail,
                            role: 'editor'
                        }
                    }
                }
            ]
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found or no edit permission' });
        }

        if (title !== undefined) note.title = title;
        if (content !== undefined) note.content = content;
        if (tags !== undefined) note.tags = tags;
        if (reminder !== undefined) {
            note.reminder = reminder;
            if (reminder === false) {
                note.reminderNotified = false;
            }
        }
        if (reminderDate !== undefined) note.reminderDate = reminderDate;

        await note.save();
        res.json(note);
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
};

// Delete a note
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const note = await Note.findOneAndDelete({
            _id: id,
            userId
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found or unauthorized' });
        }

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
};

// Share note with another user
const shareNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        const userId = req.user.id;

        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        const note = await Note.findOne({
            _id: id,
            userId
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const existingShare = note.sharedWith.find(s => s.email === email);
        if (existingShare) {
            return res.status(400).json({ error: 'Note already shared with this user' });
        }

        note.sharedWith.push({ email, role });
        await note.save();

        res.json({ message: 'Note shared successfully', sharedWith: note.sharedWith });
    } catch (error) {
        console.error('Share note error:', error);
        res.status(500).json({ error: 'Failed to share note' });
    }
};

// Create public link for note
const createPublicLink = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const note = await Note.findOne({
            _id: id,
            userId
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (!note.isPublic) {
            note.isPublic = true;
            note.publicId = uuidv4();
            await note.save();
        }

        res.json({
            publicUrl: `${req.protocol}://${req.get('host')}/api/notes/public/${note.publicId}`,
            publicId: note.publicId
        });
    } catch (error) {
        console.error('Create public link error:', error);
        res.status(500).json({ error: 'Failed to create public link' });
    }
};

// Get note by public ID
const getPublicNote = async (req, res) => {
    try {
        const { publicId } = req.params;

        const note = await Note.findOne({
            publicId,
            isPublic: true
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({
            title: note.title,
            content: note.content,
            tags: note.tags
        });
    } catch (error) {
        console.error('Get public note error:', error);
        res.status(500).json({ error: 'Failed to fetch public note' });
    }
};

// Update reminder for a note
const updateReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        const note = await Note.findOne({
            _id: id,
            $or: [
                { userId },
                {
                    'sharedWith': {
                        $elemMatch: {
                            email: userEmail,
                            role: 'editor'
                        }
                    }
                }
            ]
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found or no edit permission' });
        }

        if (date) {
            note.reminder = true;
            note.reminderDate = new Date(date);
            note.reminderNotified = false;
        } else {
            note.reminder = false;
            note.reminderDate = null;
        }

        await note.save();
        res.json({
            message: 'Reminder set successfully',
            reminder: {
                enabled: note.reminder,
                date: note.reminderDate
            }
        });
    } catch (error) {
        console.error('Update reminder error:', error);
        res.status(500).json({ error: 'Failed to set reminder' });
    }
};

// ==================== PRIVACY PASSWORD FUNCTIONS ====================

// Set or update privacy password for user's private notes
const setPrivacyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password || password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        let note = await Note.findOne({ userId });

        if (note) {
            note.privacyPassword = password;
            await note.save();
        } else {
            const newNote = new Note({
                userId,
                title: "Privacy Settings",
                content: "",
                privacyPassword: password
            });
            await newNote.save();
        }

        res.json({ message: 'Privacy password set successfully' });
    } catch (error) {
        console.error('Set privacy password error:', error);
        res.status(500).json({ error: 'Failed to set privacy password' });
    }
};

// Verify privacy password
const verifyPrivacyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        const note = await Note.findOne({ userId });

        if (!note || !note.privacyPassword) {
            return res.json({ hasPassword: false, verified: false });
        }

        const isValid = (password === note.privacyPassword);

        res.json({
            verified: isValid,
            hasPassword: true
        });
    } catch (error) {
        console.error('Verify privacy password error:', error);
        res.status(500).json({ error: 'Failed to verify password' });
    }
};

// Check if user has privacy password set
const hasPrivacyPassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const note = await Note.findOne({ userId });

        res.json({
            hasPassword: !!(note && note.privacyPassword)
        });
    } catch (error) {
        console.error('Check privacy password error:', error);
        res.status(500).json({ error: 'Failed to check password status' });
    }
};

// Update privacy password (change existing password)
const updatePrivacyPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters' });
        }

        const note = await Note.findOne({ userId });

        if (!note || !note.privacyPassword) {
            return res.status(400).json({ error: 'No privacy password set yet' });
        }

        // Verify old password
        if (note.privacyPassword !== oldPassword) {
            return res.status(401).json({ error: 'Old password is incorrect' });
        }

        note.privacyPassword = newPassword;
        await note.save();

        res.json({ message: 'Privacy password updated successfully' });
    } catch (error) {
        console.error('Update privacy password error:', error);
        res.status(500).json({ error: 'Failed to update privacy password' });
    }
};

// Remove privacy password
const removePrivacyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        const note = await Note.findOne({ userId });

        if (!note || !note.privacyPassword) {
            return res.status(400).json({ error: 'No privacy password set' });
        }

        // Verify password
        if (note.privacyPassword !== password) {
            return res.status(401).json({ error: 'Password is incorrect' });
        }

        note.privacyPassword = null;
        await note.save();

        res.json({ message: 'Privacy password removed successfully' });
    } catch (error) {
        console.error('Remove privacy password error:', error);
        res.status(500).json({ error: 'Failed to remove privacy password' });
    }
};

// ==================== EXPORTS ====================

module.exports = {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote,
    shareNote,
    createPublicLink,
    getPublicNote,
    updateReminder,
    // Privacy password functions
    setPrivacyPassword,
    verifyPrivacyPassword,
    hasPrivacyPassword,
    updatePrivacyPassword,
    removePrivacyPassword
};