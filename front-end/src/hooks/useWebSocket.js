import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { config } from '../config/env.js';

/**
 * Real WebSocket hook using socket.io.
 * Replaces the fake setInterval emitter.
 * Connects to backend Socket.io server.
 *
 * @param {Function} onEvent - callback when event arrives
 * @param {boolean} enabled - connect only when user is logged in
 */
export const useWebSocket = (bugs, onEvent, enabled = true) => {
  const socketRef   = useRef(null);
  const onEventRef  = useRef(onEvent);

  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    // dont connect is user is not autheticated
    if (!enabled) return;

    const socket = io(config.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      onEventRef.current({
        id: Date.now(),
        type: 'CONNECTED',
        message: 'Connected to BugSense live updates',
        actor: 'System',
        variant: 'success',
      });
    });

    socket.on('disconnect', () => {
      onEventRef.current({
        id: Date.now(),
        type: 'DISCONNECTED',
        message: 'Disconnected from live updates',
        actor: 'System',
        variant: 'warning',
      });
    });

    // Real backend events — type MUST be set so App.jsx can identify the event
    socket.on('bug:ai_analyzed', (data) => {
      onEventRef.current({ id: Date.now(), type: 'bug:ai_analyzed', variant: 'success', ...data });
    });

    socket.on('bug:updated', (data) => {
      onEventRef.current({ id: Date.now(), type: 'bug:updated', variant: 'info', ...data });
    });

     socket.on('bug:deleted', (data) => {
      onEventRef.current({ id: Date.now(), type: 'bug:deleted', variant: 'info', ...data });
    });

    socket.on('bug:created', (data) => {
      onEventRef.current({ id: Date.now(), type: 'bug:created', variant: 'info', ...data });
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, bugs]);
};
