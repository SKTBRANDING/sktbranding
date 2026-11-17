const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Sparkles' },
    deliverables: [{ type: String }],
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Service || mongoose.model('Service', ServiceSchema);
