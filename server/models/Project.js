const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    client: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Branding', 'Logo Design', 'Social Media', 'Packaging', 'Web Design'],
    },
    year: { type: String, default: () => new Date().getFullYear().toString() },
    coverImage: { type: String, required: true },
    imageAlt: { type: String, default: '' },
    galleryImages: [{ type: String }],
    videoUrl: { type: String, default: '' },
    videoAspectRatio: { type: String, enum: ['16:9', '9:16'], default: '16:9' },
    overview: { type: String, default: '' },
    services: [{ type: String }],
    approach: { type: String, default: '' },
    externalLink: { type: String, default: '' },
    isSample: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
