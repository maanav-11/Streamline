import express from 'express';
import { 
  createDashboard, getDashboards, toggleDashboardShare, getPublicDashboard, updateDashboardWidgets 
} from '../controllers/dashboard.controller.js';
import { protect } from '../../../middleware/auth.middleware.js';

const router = express.Router();

// Public endpoint for zero-auth dashboard viewers
router.get('/share/:shareToken', getPublicDashboard);

// Protected routes
router.use(protect);
router.post('/', createDashboard);
router.get('/workspace/:workspaceId', getDashboards);
router.patch('/:id/share', toggleDashboardShare);
router.patch('/:id/widgets', updateDashboardWidgets);

export default router;
