import { Membership } from '../features/workspaces/models/Membership.js';
import { Workspace } from '../features/workspaces/models/Workspace.js';

export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;

      if (!userId || !workspaceId) {
        return res.status(400).json({ message: 'Missing user or workspace identifier' });
      }

      // Check if user is the direct owner of the workspace
      const workspace = await Workspace.findById(workspaceId);
      if (workspace && workspace.ownerId && workspace.ownerId.toString() === userId.toString()) {
        let membership = await Membership.findOne({ userId, workspaceId });
        if (!membership || membership.role !== 'owner') {
          membership = await Membership.findOneAndUpdate(
            { userId, workspaceId },
            { role: 'owner' },
            { upsert: true, new: true }
          );
        }
        req.membership = membership;
        return next();
      }

      const membership = await Membership.findOne({ userId, workspaceId });
      if (!membership) {
        return res.status(403).json({ message: 'Not a member of this workspace' });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ 
          message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role(s)` 
        });
      }

      req.membership = membership;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};
