import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const orgSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: String,
    categories: {
      type: [String],
      default: ['General', 'Billing', 'Technical'],
    },
    sla: { type: Number, default: 24 },
    notifications: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const userSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Agent', 'Customer'],
      default: 'Customer',
    },
    active: { type: Boolean, default: true },
    availability: { type: String, default: 'Available' },
  },
  { timestamps: true },
);
userSchema.index({ email: 1 }, { unique: true });
const ticketSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    subject: { type: String, required: true },
    description: String,
    category: { type: String, default: 'General' },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    dueAt: Date,
  },
  { timestamps: true },
);
const messageSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    internal: { type: Boolean, default: false },
    attachments: [String],
  },
  { timestamps: true },
);
export const Organization =
  mongoose.models.Organization || model('Organization', orgSchema);
export const User = mongoose.models.User || model('User', userSchema);
export const Ticket = mongoose.models.Ticket || model('Ticket', ticketSchema);
export const TicketMessage =
  mongoose.models.TicketMessage || model('TicketMessage', messageSchema);
