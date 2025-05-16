import mongoose, { Schema, model } from 'mongoose';

const accountSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del usuario es obligatorio.'],
      index: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'El número de cuenta es obligatorio.'],
      unique: true,
      trim: true,
      index: true,
    },
    accountType: {
      type: String,
      required: [true, 'El tipo de cuenta es obligatorio.'],
      enum: ['savings', 'checking', 'credit_line', 'loan'],
      trim: true,
    },
    balance: {
      type: mongoose.Types.Decimal128,
      required: true,
      default: 0.0,
    },
    currency: {
      type: String,
      required: [true, 'La moneda es obligatoria.'],
      default: 'COP',
      enum: ['COP', 'USD', 'EUR'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending_activation', 'active', 'inactive', 'blocked', 'dormant', 'closed'],
      default: 'pending_activation',
    },
    overdraftLimit: {
      type: mongoose.Types.Decimal128,
      default: 0.0,
    },
    interestRate: {
      type: mongoose.Types.Decimal128,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.methods.canTransact = function () {
  return this.status === 'active';
};

const Account = model('Account', accountSchema);

export default Account;
