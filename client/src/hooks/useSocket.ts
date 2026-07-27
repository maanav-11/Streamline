import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface StreamEvent {
  streamId: string;
  streamKey: string;
  workspaceId: string;
  value: number;
  label: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export function useSocket(workspaceId: string | undefined) {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-workspace', workspaceId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('stream:event', (newEvent: StreamEvent) => {
      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
    });

    return () => {
      socket.emit('leave-workspace', workspaceId);
      socket.disconnect();
    };
  }, [workspaceId]);

  return { events, isConnected, socket: socketRef.current };
}

export function usePublicShareSocket(shareToken: string | undefined) {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!shareToken) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-share', shareToken);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('stream:event', (newEvent: StreamEvent) => {
      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    });

    return () => {
      socket.emit('leave-share', shareToken);
      socket.disconnect();
    };
  }, [shareToken]);

  return { events, isConnected };
}
