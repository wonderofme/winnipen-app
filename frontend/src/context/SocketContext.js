import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../utils/config';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const newSocket = io(API_BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected:', newSocket.id);
        setConnected(true);
        
        // Join the main room
        newSocket.emit('join', { room: 'winnipen' });
        console.log('🏠 Joined winnipen room');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Notification events
      newSocket.on('new_notification', (notification) => {
        console.log('New notification received:', notification);
        // You can add a global notification handler here
        // For example, show a toast or update a global notification count
      });

      newSocket.on('follow', (data) => {
        console.log('Follow event received:', data);
      });

      newSocket.on('unfollow', (data) => {
        console.log('Unfollow event received:', data);
      });

      newSocket.on('notifications_read', (data) => {
        console.log('Notifications marked as read:', data);
      });

      // Debug: Log all socket events
      const originalEmit = newSocket.emit;
      newSocket.emit = function(event, ...args) {
        console.log('📤 Socket emit:', event, args);
        return originalEmit.apply(this, [event, ...args]);
      };

      const originalOn = newSocket.on;
      newSocket.on = function(event, callback) {
        console.log('👂 Socket listening for:', event);
        return originalOn.call(this, event, (...args) => {
          console.log('📥 Socket received:', event, args);
          return callback(...args);
        });
      };

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // Disconnect socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  const emitEvent = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const onEvent = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const offEvent = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    emitEvent,
    onEvent,
    offEvent
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
