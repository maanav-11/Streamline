import mongoose from 'mongoose';
import crypto from 'crypto';

const streamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  streamKey: { 
    type: String, 
    unique: true, 
    default: () => 'strm_' + crypto.randomBytes(16).toString('hex') 
  },
  createdUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastActiveAt: { type: Date, default: Date.now },
  eventCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Stream = mongoose.model('Stream', streamSchema);
