import { Schema, model } from 'mongoose';

const addressSchema = new Schema(
  {
    street: { type: String, trim: true },
    apartmentOrUnit: { type: String, trim: true },
    city: { type: String, trim: true },
    stateOrDepartment: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'CO' },
  },
  { _id: false }
);

const identificationDocumentSchema = new Schema(
  {
    type: { type: String, enum: ['CC', 'CE', 'PASSPORT', 'NIT', 'TI'], trim: true },
    number: { type: String, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    auth0Id: { type: String, required: true, unique: true, index: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: { type: Boolean, default: false },
    phone: {
      countryCode: { type: String, trim: true },
      number: { type: String, trim: true },
      isVerified: { type: Boolean, default: false },
    },
    address: addressSchema,
    dateOfBirth: { type: Date },
    nationality: { type: String, trim: true },
    identificationDocument: identificationDocumentSchema,
    status: {
      type: String,
      enum: [
        'pending_verification',
        'active',
        'inactive',
        'suspended',
        'document_verification_required',
        'closed',
      ],
      default: 'pending_verification',
    },
    roles: {
      type: [
        {
          type: String,
          enum: ['customer', 'admin_support_l1', 'admin_finance', 'admin_operations'],
        },
      ],
      default: ['customer'],
    },
    agreedToTermsVersion: { type: String, trim: true },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      language: { type: String, default: 'es', trim: true },
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

const User = model('User', userSchema);

export default User;
