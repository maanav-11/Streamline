import mongoose from 'mongoose';
import crypto from 'crypto';

const dashboardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  streamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }],
  widgets: { type: Array, default: [] },
  viewCount: { type: Number, default: 0 },
  shareToken: { 
    type: String, 
    unique: true, 
    default: () => 'dash_share_' + crypto.randomBytes(16).toString('hex') 
  },
  isPublicShareEnabled: { type: Boolean, default: false },
  createdUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Dashboard = mongoose.model('Dashboard', dashboardSchema);
