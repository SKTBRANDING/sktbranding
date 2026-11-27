const mongoose = require('mongoose');

const ReportDeliverableItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    taskId: { type: String, default: '' },
    title: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    category: { type: String, default: '' },
    dimensions: { type: String, default: '' },
  },
  { _id: false }
);

const ReportServiceSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, default: '' },
    items: { type: [ReportDeliverableItemSchema], default: [] },
  },
  { _id: false }
);

const ClientReportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, default: '', index: true },
    clientName: { type: String, required: true, index: true },
    clientLogo: { type: String, default: '' },
    reportMonth: { type: String, required: true, index: true }, // e.g. "October 2026", "November 2026"
    reportTitle: { type: String, default: '' },
    executiveSummaryTitle: { type: String, default: '' },
    executiveSummaryText: { type: String, default: '' },
    sections: { type: [ReportServiceSectionSchema], default: [] },
    thankYouTitle: { type: String, default: 'THANK YOU' },
    status: { type: String, enum: ['draft', 'finalized', 'shared'], default: 'finalized' },
    theme: {
      coverBackground: { type: String, default: 'dark_gradient' },
      pageBackground: { type: String, default: '#FAF7F2' },
      primaryColor: { type: String, default: '#D60000' },
      textColor: { type: String, default: '#1A1A1A' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClientReport', ClientReportSchema);
