import express from 'express';
import { createStream, getStreams, ingestData } from '../controllers/stream.controller.js';
import { protect } from '../../../middleware/auth.middleware.js';

const router = express.Router();

// Public data ingestion endpoint
router.post('/ingest/:streamKey', ingestData);

// Protected stream routes
router.use(protect);
router.post('/', createStream);
router.get('/workspace/:workspaceId', getStreams);

export default router;
