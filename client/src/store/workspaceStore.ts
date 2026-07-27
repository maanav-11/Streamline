import { create } from 'zustand';
import axios from 'axios';

export interface Workspace {
  _id: string;
  name: string;
  ownerId: string;
  createdAt?: string;
}

export interface StreamItem {
  _id: string;
  name: string;
  description?: string;
  workspaceId: string;
  streamKey: string;
  lastActiveAt?: string;
  eventCount: number;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  userRole: 'owner' | 'editor' | 'viewer';
  streams: StreamItem[];
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  setActiveWorkspace: (workspace: Workspace) => void;
  fetchStreams: (workspaceId: string) => Promise<void>;
  fetchRole: (workspaceId: string) => Promise<void>;
  createStream: (name: string, description?: string) => Promise<StreamItem | null>;
  addStreamEvent: (streamKey: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  userRole: 'owner',
  streams: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.get<Workspace[]>('/api/workspaces');
      set({ workspaces: data, isLoading: false });
      if (data.length > 0) {
        const savedId = localStorage.getItem('activeWorkspaceId');
        const active = data.find((w) => w._id === savedId) || data[0];
        localStorage.setItem('activeWorkspaceId', active._id);
        set({ activeWorkspace: active });
        get().fetchStreams(active._id);
        get().fetchRole(active._id);
      } else {
        // Automatically provision a default workspace if user has none
        await get().createWorkspace('My Workspace');
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load workspaces', isLoading: false });
    }
  },

  createWorkspace: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post<Workspace>('/api/workspaces', { name });
      localStorage.setItem('activeWorkspaceId', data._id);
      set((state) => ({
        workspaces: [...state.workspaces, data],
        activeWorkspace: data,
        userRole: 'owner',
        isLoading: false,
      }));
      get().fetchStreams(data._id);
      return data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create workspace', isLoading: false });
      return null;
    }
  },

  setActiveWorkspace: (workspace: Workspace) => {
    localStorage.setItem('activeWorkspaceId', workspace._id);
    set({ activeWorkspace: workspace });
    get().fetchStreams(workspace._id);
    get().fetchRole(workspace._id);
  },

  fetchRole: async (workspaceId: string) => {
    try {
      const active = get().activeWorkspace;
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      if (active && currentUser && active.ownerId === currentUser._id) {
        set({ userRole: 'owner' });
        return;
      }
      const { data } = await axios.get<any[]>(`/api/workspaces/${workspaceId}/members`);
      if (currentUser) {
        const myMembership = data.find((m) => (m.userId?._id || m.userId) === currentUser._id);
        if (myMembership?.role) {
          set({ userRole: myMembership.role });
          return;
        }
      }
      set({ userRole: 'viewer' });
    } catch (err) {
      console.error('Fetch role error:', err);
      set({ userRole: 'viewer' });
    }
  },

  fetchStreams: async (workspaceId: string) => {
    try {
      const { data } = await axios.get<StreamItem[]>(`/api/streams/workspace/${workspaceId}`);
      set({ streams: data });
    } catch (err: any) {
      console.error('Fetch streams error:', err);
    }
  },

  createStream: async (name: string, description?: string) => {
    const activeWs = get().activeWorkspace;
    if (!activeWs) return null;
    try {
      const { data } = await axios.post<StreamItem>('/api/streams', {
        name,
        description,
        workspaceId: activeWs._id,
      });
      set((state) => ({ streams: [data, ...state.streams] }));
      return data;
    } catch (err: any) {
      console.error('Create stream error:', err);
      return null;
    }
  },

  addStreamEvent: (streamKey: string) => {
    set((state) => ({
      streams: state.streams.map((s) =>
        s.streamKey === streamKey
          ? { ...s, eventCount: s.eventCount + 1, lastActiveAt: new Date().toISOString() }
          : s
      ),
    }));
  },
}));
