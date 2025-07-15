"use client";

import { useAppStore } from './store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity in milliseconds
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = false;

  constructor() {
    this.setupActivityListeners();
  }

  private setupActivityListeners() {
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, this.resetTimer.bind(this), true);
    });
  }

  private resetTimer() {
    this.lastActivity = Date.now();
    this.clearTimeout();
    this.startTimer();
  }

  private startTimer() {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, SESSION_TIMEOUT);
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private handleSessionTimeout() {
    // Clear auth token
    localStorage.removeItem('authToken');
    
    // Reset store state
    const { logout } = useAppStore.getState();
    logout();
    
    // Show notification
    toast.error('Session expired due to inactivity. Please log in again.');
    
    // Redirect to login
    window.location.href = '/login';
  }

  public start() {
    this.isActive = true;
    this.lastActivity = Date.now();
    this.startTimer();
  }

  public stop() {
    this.isActive = false;
    this.clearTimeout();
  }

  public getTimeRemaining(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, SESSION_TIMEOUT - elapsed);
  }

  public isSessionActive(): boolean {
    return this.isActive && this.getTimeRemaining() > 0;
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();

// React hook for session management
export function useSessionManager() {
  const { user, logout } = useAppStore();
  const router = useRouter();

  const handleLogout = () => {
    sessionManager.stop();
    localStorage.removeItem('authToken');
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const extendSession = () => {
    if (user) {
      sessionManager.resetTimer();
    }
  };

  return {
    handleLogout,
    extendSession,
    timeRemaining: sessionManager.getTimeRemaining(),
    isSessionActive: sessionManager.isSessionActive(),
  };
}

// Utility function to check if user is authenticated
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('authToken');
  return !!token && sessionManager.isSessionActive();
}

// Utility function to get auth token
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Utility function to set auth token
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
  sessionManager.start();
}

// Utility function to clear auth token
export function clearAuthToken(): void {
  localStorage.removeItem('authToken');
  sessionManager.stop();
} 