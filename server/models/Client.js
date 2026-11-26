const mongoose = require('mongoose');

const ClientServiceRateSchema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'Custom', trim: true },
  },
  { _id: false }
);

const ClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    company: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    address: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    serviceRates: {
      type: [ClientServiceRateSchema],
      default: [
        { serviceName: 'Poster Design', rate: 300, category: 'Poster Design' },
        { serviceName: 'Video / Motion Graphics', rate: 500, category: 'Video' },
        { serviceName: 'Social Media Post & Creatives', rate: 300, category: 'Social Media' },
        { serviceName: 'Logo Design & Monogram', rate: 1500, category: 'Logo Design' },
        { serviceName: 'Brand Identity & Guidelines', rate: 3500, category: 'Branding' },
        { serviceName: 'Packaging & Label Design', rate: 2000, category: 'Packaging' },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Client', ClientSchema);
