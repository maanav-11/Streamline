import { Dashboard } from '../models/Dashboard.js';
import { Membership } from '../../workspaces/models/Membership.js';
import { AuditLog } from '../../audit/models/AuditLog.js';
import { Stream } from '../../streams/models/Stream.js';
import { createDashboardSchema, toggleShareSchema } from '../../../../../shared/src/schemas/dashboard.schema.js';

export const createDashboard = async (req, res) => {
  try {
    const validated = createDashboardSchema.parse(req.body);
    const userId = req.user._id;

    const membership = await Membership.findOne({ userId, workspaceId: validated.workspaceId });
    if (!membership) {
      return res.status(403).json({ message: 'Not authorized for this workspace' });
    }

    const dashboard = await Dashboard.create({
      name: validated.name,
      workspaceId: validated.workspaceId,
      streamIds: validated.streamIds || [],
      widgets: validated.widgets || [],
      createdUserId: userId
    });

    res.status(201).json(dashboard);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Create dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboards = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    const membership = await Membership.findOne({ userId, workspaceId });
    if (!membership) {
      return res.status(403).json({ message: 'Not authorized for this workspace' });
    }

    const dashboards = await Dashboard.find({ workspaceId }).populate('streamIds');
    res.json(dashboards);
  } catch (error) {
    console.error('Get dashboards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleDashboardShare = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = toggleShareSchema.parse(req.body);
    const userId = req.user._id;

    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    const membership = await Membership.findOne({ userId, workspaceId: dashboard.workspaceId });
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ message: 'Requires owner or editor role to toggle public sharing' });
    }

    dashboard.isPublicShareEnabled = validated.enabled;
    await dashboard.save();

    // Log Audit Event
    await AuditLog.create({
      workspaceId: dashboard.workspaceId,
      userId,
      action: 'DASHBOARD_SHARE_TOGGLED',
      details: {
        dashboardId: dashboard._id,
        dashboardName: dashboard.name,
        isPublicShareEnabled: dashboard.isPublicShareEnabled,
        shareToken: dashboard.shareToken
      }
    });

    res.json(dashboard);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Toggle share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicDashboard = async (req, res) => {
  try {
    const { shareToken } = req.params;

    // Atomically increment viewCount and fetch populated dashboard
    const dashboard = await Dashboard.findOneAndUpdate(
      { shareToken, isPublicShareEnabled: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('streamIds');

    if (!dashboard) {
      return res.status(404).json({ message: 'Shared dashboard not found or link has been disabled' });
    }

    res.json(dashboard);
  } catch (error) {
    console.error('Get public dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDashboardWidgets = async (req, res) => {
  try {
    const { id } = req.params;
    const { widgets } = req.body;
    const userId = req.user._id;

    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    const membership = await Membership.findOne({ userId, workspaceId: dashboard.workspaceId });
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ message: 'Requires owner or editor role to update widgets' });
    }

    dashboard.widgets = widgets || [];
    await dashboard.save();

    res.json(dashboard);
  } catch (error) {
    console.error('Update widgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
