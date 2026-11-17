const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    service: { type: String, default: 'General Inquiry' },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Completed'],
      default: 'New',
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);
