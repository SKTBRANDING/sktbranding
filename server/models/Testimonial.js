const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    quote: { type: String, required: true },
    author: { type: String, required: true, trim: true },
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    avatar: { type: String, default: '' },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    published: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
