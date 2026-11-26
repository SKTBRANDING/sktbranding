const mongoose = require('mongoose');

const TaskAttachmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    type: { type: String, default: 'application/octet-stream' },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
    category: {
      type: String,
      enum: ['image', 'pdf', 'model', 'audio', 'archive', 'design', 'doc', 'other'],
      default: 'doc',
    },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const TaskSubmissionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    version: { type: Number, required: true },
    versionLabel: { type: String, required: true },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    designerId: { type: String, required: true },
    designerName: { type: String, required: true },
    notes: { type: String, default: '' },
    files: [TaskAttachmentSchema],
    designerVoiceNote: { type: TaskAttachmentSchema, default: null },
    reviewStatus: {
      type: String,
      enum: ['pending', 'revision_requested', 'approved'],
      default: 'pending',
    },
    reviewedAt: { type: String },
    adminFeedback: { type: String },
    adminVoiceFeedback: { type: TaskAttachmentSchema, default: null },
    adminFeedbackAttachments: [TaskAttachmentSchema],
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    clientCompany: { type: String, default: '' },
    clientPhone: { type: String, default: '' },
    clientEmail: { type: String, default: '' },
    clientAddress: { type: String, default: '' },
    serviceCategory: { type: String, default: 'Poster Design' },
    serviceName: { type: String, default: '' },
    brief: { type: String, required: true },
    textContent: { type: String, default: '' },
    voiceBrief: { type: TaskAttachmentSchema, default: null },
    deliverables: { type: String, default: 'Standard design deliverables' },
    rate: { type: Number, default: 300 },
    dimensions: { type: String, default: '' },
    fileFormats: { type: String, default: 'AI, PSD, PDF, PNG' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    deadline: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'available',
        'assigned',
        'in_progress',
        'submitted',
        'revision_requested',
        'resubmitted',
        'completed',
      ],
      default: 'available',
    },
    assignedDesignerId: { type: String, default: null },
    assignedDesignerName: { type: String, default: null },
    assignedAt: { type: String },
    referenceFiles: [TaskAttachmentSchema],
    submissions: [TaskSubmissionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
