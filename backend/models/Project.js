const mongoose = require('mongoose');

const GRID_STYLES = ['full', 'half-top', 'half-bottom'];
const SOURCE_TYPES = ['vimeo', 'direct', 'external'];

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: SOURCE_TYPES,
      required: true,
      default: 'vimeo',
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    vimeoId: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
    },
    gridStyle: {
      type: String,
      enum: GRID_STYLES,
      default: 'full',
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ order: 1, createdAt: 1 });
projectSchema.index({ vimeoId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Project', projectSchema);
