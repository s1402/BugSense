/**
 * Socket.io event setup.
 * All real-time events flow through here.
 * Frontend connects once on login and listens for these events.
 *
 * Events emitted:
 *   bug:ai_analyzed  → AI pipeline finished for a bug
 *   bug:updated      → status/priority changed
 *   bug:deleted      → bug deleted
 *   bug:created      → new bug reported
 */

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client can join a room for a specific bug
    socket.on('bug:join', (bugId) => {
      socket.join(`bug:${bugId}`);
    });

    socket.on('bug:leave', (bugId) => {
      socket.leave(`bug:${bugId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
