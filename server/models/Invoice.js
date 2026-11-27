const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: 'Branding' },
    quantity: { type: Number, required: true, default: 1, min: 0 },
    rate: { type: Number, required: true, default: 0, min: 0 },
    amount: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true, trim: true },
    clientId: { type: String, default: '' },
    clientName: { type: String, required: true, trim: true, index: true },
    clientEmail: { type: String, required: true, trim: true, lowercase: true },
    clientPhone: { type: String, default: '', trim: true },
    clientAddress: { type: String, default: '', trim: true },
    clientCompany: { type: String, default: '', trim: true },

    projectId: { type: String, default: '' },
    projectName: { type: String, default: '', trim: true },

    issueDate: { type: String, required: true },
    dueDate: { type: String, required: true },

    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
      index: true,
    },
    currency: { type: String, default: 'INR', uppercase: true },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'upi', 'paypal', 'stripe', 'cash', 'crypto'],
      default: 'bank_transfer',
    },
    paymentDetails: { type: String, default: '' },
    notes: { type: String, default: '' },
    paidAt: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
