import express from 'express';
import Note from '../models/Note.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, noteSchema, updateNoteSchema } from '../middleware/validation.js';

const router = express.Router();

// -------------------- Authentication --------------------
// All routes require a valid JWT token
router.use(authenticateToken);

// -------------------- Get all notes --------------------
router.get('/', async (req, res) => {
  try {
    const { favorite, deleted } = req.query;

    // Base filter for current user
    let filter = { userId: req.user._id };

    // Filter by favorite
    if (favorite === 'true') filter.isFavorite = true;

    // Filter by deleted status
    if (deleted === 'true') filter.isDeleted = true;
    else filter.isDeleted = { $ne: true }; // Default: exclude deleted notes

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .select('-userId') // exclude userId from response
      .lean();

    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error retrieving notes' });
  }
});

// -------------------- Get a specific note --------------------
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('-userId').lean();

    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error retrieving note' });
  }
});

// -------------------- Create a new note --------------------
router.post('/', validate(noteSchema), async (req, res) => {
  try {
    const { title, content, isFavorite = false, tags = [] } = req.body;

    const note = new Note({
      userId: req.user._id,
      title,
      content,
      isFavorite,
      tags,
    });

    await note.save();
    res.status(201).json(note.toSafeObject());
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error creating note' });
  }
});

// -------------------- Update a note --------------------
router.patch('/:id', validate(updateNoteSchema), async (req, res) => {
  try {
    const updateData = req.body;
    const allowedUpdates = ['title', 'content', 'isFavorite', 'tags'];
    const filteredUpdates = {};

    // Filter out invalid fields
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) filteredUpdates[key] = updateData[key];
    });

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-userId');

    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json(note.toSafeObject());
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Server error updating note' });
  }
});

// -------------------- Soft delete (move to trash) --------------------
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) return res.status(404).json({ message: 'Note not found' });

    await note.softDelete();
    res.json({ message: 'Note moved to trash successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
});

// -------------------- Restore a note from trash --------------------
router.post('/:id/restore', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: true,
    });

    if (!note) return res.status(404).json({ message: 'Note not found in trash' });

    await note.restore();
    res.json({ message: 'Note restored successfully', note: note.toSafeObject() });
  } catch (error) {
    console.error('Restore note error:', error);
    res.status(500).json({ message: 'Server error restoring note' });
  }
});

// -------------------- Permanently delete a note --------------------
router.delete('/:id/hard', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: true, // only trashed notes can be permanently deleted
    });

    if (!note) return res.status(404).json({ message: 'Note not found in trash' });

    res.json({ message: 'Note permanently deleted' });
  } catch (error) {
    console.error('Hard delete note error:', error);
    res.status(500).json({ message: 'Server error permanently deleting note' });
  }
});

export default router;
