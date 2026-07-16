import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' },
}, { timestamps: true });

membershipSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export const Membership = mongoose.model('Membership', membershipSchema);
