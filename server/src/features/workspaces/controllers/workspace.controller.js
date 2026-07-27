import { Workspace } from '../models/Workspace.js';
import { Membership } from '../models/Membership.js';
import { Invite } from '../../invites/models/Invite.js';
import { AuditLog } from '../../audit/models/AuditLog.js';
import { createWorkspaceSchema } from '../../../../../shared/src/schemas/workspace.schema.js';
import { inviteMemberSchema } from '../../../../../shared/src/schemas/dashboard.schema.js';
import jwt from 'jsonwebtoken';

export const createWorkspace = async (req, res) => {
  try {
    const validatedData = createWorkspaceSchema.parse(req.body);
    const { name } = validatedData;
    const userId = req.user._id;

    const workspace = await Workspace.create({
      name,
      ownerId: userId,
    });

    await Membership.create({
      userId,
      workspaceId: workspace._id,
      role: 'owner',
    });

    res.status(201).json(workspace);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const userId = req.user._id;

    const memberships = await Membership.find({ userId }).populate('workspaceId');
    const workspaces = memberships.map(m => m.workspaceId).filter(Boolean);

    res.json(workspaces);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const membership = await Membership.findOne({ userId, workspaceId: id });
    if (!membership) {
      return res.status(403).json({ message: 'Not authorized to access this workspace' });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Get workspace by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Guarded by checkRole('owner', 'editor')
export const getWorkspaceMembers = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const memberships = await Membership.find({ workspaceId }).populate('userId', 'name email avatarUrl');
    res.json(memberships);
  } catch (error) {
    console.error('Get workspace members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Guarded by checkRole('owner')
export const inviteMember = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const validated = inviteMemberSchema.parse(req.body);
    const invitedByUserId = req.user._id;

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const token = jwt.sign(
      { workspaceId, email: validated.email, role: validated.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '48h' }
    );

    const pendingInvite = await Invite.create({
      email: validated.email,
      workspaceId,
      role: validated.role,
      token,
      expiresAt,
      invitedByUserId,
      status: 'pending'
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/accept-invite?token=${token}`;

    // Write Audit Log
    await AuditLog.create({
      workspaceId,
      userId: invitedByUserId,
      action: 'MEMBER_INVITED',
      details: {
        invitedEmail: validated.email,
        role: validated.role,
        inviteId: pendingInvite._id
      }
    });

    res.status(201).json({
      message: 'Pending invitation generated successfully (48hr link)',
      inviteUrl,
      invite: pendingInvite
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return res.status(400).json({ message: 'Invite token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired invitation token (48hr limit passed)' });
    }

    const invite = await Invite.findOne({ token, status: 'pending' });
    if (!invite) {
      return res.status(400).json({ message: 'Invite token is invalid or has already been used' });
    }

    if (new Date() > invite.expiresAt) {
      invite.status = 'expired';
      await invite.save();
      return res.status(400).json({ message: 'Invitation link has expired' });
    }

    // Create or update membership
    const membership = await Membership.findOneAndUpdate(
      { userId, workspaceId: invite.workspaceId },
      { role: invite.role },
      { upsert: true, new: true }
    );

    invite.status = 'accepted';
    await invite.save();

    // Write Audit Log
    await AuditLog.create({
      workspaceId: invite.workspaceId,
      userId,
      action: 'MEMBER_INVITE_ACCEPTED',
      details: {
        acceptedEmail: invite.email,
        role: invite.role,
        inviteId: invite._id
      }
    });

    res.json({ message: 'Invitation accepted successfully!', membership });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userId = req.user._id;

    const membership = await Membership.findOne({ userId, workspaceId });
    if (!membership) {
      return res.status(403).json({ message: 'Not authorized for this workspace' });
    }

    const logs = await AuditLog.find({ workspaceId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

