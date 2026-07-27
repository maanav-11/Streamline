import { Stream } from '../models/Stream.js';
import { Membership } from '../../workspaces/models/Membership.js';
import { Dashboard } from '../../dashboards/models/Dashboard.js';
import { createStreamSchema } from '../../../../../shared/src/schemas/stream.schema.js';

export const createStream = async (req, res) => {
  try {
    const { workspaceId } = req.body;
    const userId = req.user._id;

    const membership = await Membership.findOne({ userId, workspaceId });
    if (!membership) {
      return res.status(403).json({ message: 'Not authorized for this workspace' });
    }

    const validated = createStreamSchema.parse(req.body);

    const stream = await Stream.create({
      name: validated.name,
      description: validated.description || '',
      workspaceId,
      createdUserId: userId
    });

    res.status(201).json(stream);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Create stream error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStreams = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    const membership = await Membership.findOne({ userId, workspaceId });
    if (!membership) {
      return res.status(403).json({ message: 'Not authorized for this workspace' });
    }

    const streams = await Stream.find({ workspaceId }).sort({ createdAt: -1 });
    res.json(streams);
  } catch (error) {
    console.error('Get streams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const ingestData = async (req, res) => {
  try {
    const { streamKey } = req.params;
    const stream = await Stream.findOne({ streamKey });

    if (!stream) {
      return res.status(404).json({ message: 'Invalid stream key' });
    }

    const payload = req.body;
    const numericValue = typeof payload.value === 'number' ? payload.value : (parseFloat(payload.value) || Math.floor(Math.random() * 100));

    const event = {
      streamId: stream._id,
      streamKey: stream.streamKey,
      workspaceId: stream.workspaceId,
      value: numericValue,
      label: payload.label || stream.name,
      metadata: payload.metadata || {},
      timestamp: new Date().toISOString()
    };

    // Update stream counters
    stream.eventCount += 1;
    stream.lastActiveAt = new Date();
    await stream.save();

    // Broadcast real-time event via Socket.io to Workspace & Public Dashboard Share rooms
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${stream.workspaceId}`).emit('stream:event', event);
      io.to(`stream:${stream.streamKey}`).emit('stream:event', event);

      // Find dashboards that include this stream and have public sharing enabled
      const sharedDashboards = await Dashboard.find({
        streamIds: stream._id,
        isPublicShareEnabled: true
      });

      for (const dash of sharedDashboards) {
        if (dash.shareToken) {
          io.to(`share:${dash.shareToken}`).emit('stream:event', event);
        }
      }
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ message: 'Ingestion error' });
  }
};

