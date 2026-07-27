import { z } from 'zod';

export const createDashboardSchema = z.object({
  name: z.string().min(2, 'Dashboard name must be at least 2 characters'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  streamIds: z.array(z.string()).optional().default([]),
  widgets: z.array(z.any()).optional().default([]),
});

export const updateDashboardWidgetsSchema = z.object({
  widgets: z.array(z.any()),
});

export const toggleShareSchema = z.object({
  enabled: z.boolean(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});
