import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});
