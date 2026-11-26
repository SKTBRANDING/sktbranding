const mongoose = require('mongoose');

const DesignerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    specialty: { type: String, default: 'Brand Designer' },
    avatar: { type: String, default: '' },
    instagram: { type: String, default: '' },
    phone: { type: String, default: '' },
    accountDetails: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    experienceYears: { type: String, default: '' },
    companyCode: { type: String, default: '' },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'revoked'],
      default: 'active',
    },
    lastActiveAt: { type: Date },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Designer || mongoose.model('Designer', DesignerSchema);
