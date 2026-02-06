const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['INCOME', 'EXPENSE'],
    required: true 
  },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['subscription', 'payout'], 
    required: true 
  },
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Counselor' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },

  esewaId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },

  description: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
