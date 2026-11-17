const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    agencyName: { type: String, default: 'SKT BRANDING' },
    tagline: { type: String, default: 'High-Impact Brand Identity & Visual Strategy' },
    logoText: { type: String, default: 'SKT' },
    logoMarkUrl: { type: String, default: '' },
    email: { type: String, default: 'hello@sktbranding.com' },
    phone: { type: String, default: '+1 (555) 234-5678' },
    whatsapp: { type: String, default: '+15552345678' },
    address: { type: String, default: 'Zurich • New York • Dubai' },
    socialLinks: {
      whatsapp: { type: String, default: '' },
      email: { type: String, default: '' },
      instagram: { type: String, default: '' },
      behance: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    seoTitle: { type: String, default: 'SKT Branding | International Brand Architecture & Design' },
    seoDescription: { type: String, default: 'Award-winning branding agency specializing in visual identity, packaging architecture, and digital aesthetics.' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
