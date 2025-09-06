import mongoose from 'mongoose';

// -------------------- Content Subschema --------------------
const contentSchema = new mongoose.Schema(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    salt: { type: String, required: true },
  },
  { _id: false } // Do not create separate _id for content
);

// -------------------- Note Schema --------------------
const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    content: {
      type: contentSchema,
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { timestamps: true } // createdAt & updatedAt
);

// -------------------- Indexes --------------------
noteSchema.index({ userId: 1, isDeleted: 1, isFavorite: 1 });
noteSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });

// -------------------- Instance Methods --------------------

// Soft delete a note (move to trash)
noteSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Restore a soft-deleted note
noteSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Return a safe object for API responses (exclude sensitive info)
noteSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    title: this.title,
    content: this.content,
    isFavorite: this.isFavorite,
    isDeleted: this.isDeleted,
    deletedAt: this.deletedAt,
    tags: this.tags,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// -------------------- Model Export --------------------
const Note = mongoose.model('Note', noteSchema);

export default Note;
