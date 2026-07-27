import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { 
    type: String, 
    enum: ['DASHBOARD_SHARE_TOGGLED', 'MEMBER_INVITED', 'MEMBER_INVITE_ACCEPTED'], 
    required: true 
  },
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
