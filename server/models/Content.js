const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema(
  {
    hero: {
      badge: { type: String, default: 'EXECUTIVE BRAND ARCHITECTURE' },
      headline: { type: String, default: 'We engineer magnetic brands that dominate high-value markets.' },
      supportingCopy: { type: String, default: 'From distilled brand strategy to tactile packaging and electric motion systems, we define visual superiority for industry leaders.' },
      primaryButtonText: { type: String, default: 'Initiate Commission' },
      primaryButtonLink: { type: String, default: '#contact' },
      secondaryButtonText: { type: String, default: 'Explore Selected Works' },
      secondaryButtonLink: { type: String, default: '#portfolio' },
      heroImage: { type: String, default: '' },
      stats: [
        {
          id: { type: String, default: '' },
          value: { type: String, default: '' },
          label: { type: String, default: '' },
        },
      ],
    },
    about: {
      badge: { type: String, default: 'OUR PHILOSOPHY' },
      headline: { type: String, default: 'Design without compromise. Strategy with teeth.' },
      intro: { type: String, default: 'Founded on the principle that exceptional brands exist at the intersection of stark minimalism and raw kinetic energy.' },
      approach: { type: String, default: 'We don’t follow design trends; we establish visual benchmarks that withstand market shifts.' },
      image: { type: String, default: '' },
      values: [
        {
          title: { type: String, default: '' },
          description: { type: String, default: '' },
        },
      ],
      founder: {
        name: { type: String, default: '' },
        role: { type: String, default: '' },
        bio: { type: String, default: '' },
        photo: { type: String, default: '' },
        enabled: { type: Boolean, default: false },
      },
    },
    process: {
      badge: { type: String, default: 'THE METHODOLOGY' },
      headline: { type: String, default: 'Structured Precision. Unfiltered Creativity.' },
      description: { type: String, default: 'A four-stage linear sprint designed to move from strategic clarity to flawless market deployment.' },
      steps: [
        {
          number: { type: String, default: '' },
          title: { type: String, default: '' },
          subtitle: { type: String, default: '' },
          description: { type: String, default: '' },
          tags: [{ type: String }],
          thumbnail: { type: String, default: '' },
        },
      ],
    },
    finalCta: {
      badge: { type: String, default: 'READY TO SCALE' },
      headline: { type: String, default: 'Command Attention in Your Industry' },
      supportingCopy: { type: String, default: 'Schedule a private consultation with our executive design partners.' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Content || mongoose.model('Content', ContentSchema);
