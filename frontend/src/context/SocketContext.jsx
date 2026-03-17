import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from './authStore';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketRef.current = io('/', { auth: { token }, transports: ['websocket'] });
      socketRef.current.on('connect', () => console.log('🔌 Socket connected'));
      socketRef.current.on('connect_error', (e) => console.error('Socket error:', e.message));
    }
    return () => { socketRef.current?.disconnect(); };
  }, [isAuthenticated, token]);

  return <SocketContext.Provider value={socketRef.current}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
