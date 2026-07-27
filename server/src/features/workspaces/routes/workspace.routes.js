import express from 'express';
import { 
  createWorkspace, getWorkspaces, getWorkspaceById, 
  inviteMember, getWorkspaceMembers, acceptInvite, getAuditLogs 
} from '../controllers/workspace.controller.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { checkRole } from '../../../middleware/role.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', getWorkspaceById);

// Member management & RBAC guards
router.post('/:id/invite', checkRole('owner'), inviteMember);
router.get('/:id/members', checkRole('owner', 'editor', 'viewer'), getWorkspaceMembers);
router.post('/accept-invite', acceptInvite);

// Audit logs
router.get('/:id/audit-logs', getAuditLogs);

export default router;

