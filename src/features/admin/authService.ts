import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type AuthError,
  type User,
} from 'firebase/auth';
import type { AdminSession } from '../../types/quiz';
import { auth } from '../../lib/firebase';

export interface AuthService {
  login(email: string, password: string): Promise<AdminSession>;
  logout(): Promise<void>;
  getSession(): Promise<AdminSession | null>;
  onAuthStateChanged(callback: (session: AdminSession | null) => void): () => void;
  checkAdminPrivilege(user: User): Promise<boolean>;
}

export class FirebaseAuthService implements AuthService {
  private listeners = new Set<(session: AdminSession | null) => void>();
  private currentSession: AdminSession | null = null;

  /**
   * Verifies if the authenticated user has admin privileges.
   * Checks:
   * 1. Firebase Auth Custom Claim: `token.claims.admin === true`
   * 2. Server/Environment UID Allowlist: `VITE_ADMIN_UIDS`
   * 3. Server/Environment Email Allowlist: `VITE_ADMIN_EMAILS`
   */
  public async checkAdminPrivilege(user: User): Promise<boolean> {
    try {
      const idTokenResult = await user.getIdTokenResult(true);
      if (idTokenResult.claims.admin === true) {
        return true;
      }

      // Check UID allowlist
      const uidAllowlist = (import.meta.env.VITE_ADMIN_UIDS || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (uidAllowlist.length > 0 && uidAllowlist.includes(user.uid)) {
        return true;
      }

      // Check email allowlist
      const emailAllowlist = (import.meta.env.VITE_ADMIN_EMAILS || '')
        .split(',')
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      if (user.email && emailAllowlist.includes(user.email.toLowerCase())) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error verifying admin custom claims:', err);
      return false;
    }
  }

  private async buildSession(user: User): Promise<AdminSession> {
    const isAdmin = await this.checkAdminPrivilege(user);
    return {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Administrator',
      isAdmin,
      loggedInAt: user.metadata.lastSignInTime || new Date().toISOString(),
    };
  }

  public async login(email: string, password: string): Promise<AdminSession> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const session = await this.buildSession(userCredential.user);
      this.currentSession = session;
      return session;
    } catch (err) {
      const authErr = err as AuthError;
      switch (authErr.code) {
        case 'auth/configuration-not-found':
          throw new Error(
            'Firebase Authentication is not enabled for your project in the Firebase Console. You must enable the "Email/Password" provider under Build → Authentication → Sign-in method.'
          );
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          throw new Error('Invalid email or password.');
        case 'auth/invalid-email':
          throw new Error('Please enter a valid email address.');
        case 'auth/user-disabled':
          throw new Error('This administrator account has been disabled.');
        case 'auth/too-many-requests':
          throw new Error('Too many failed attempts. Please try again later.');
        case 'auth/network-request-failed':
          throw new Error('Network error. Check your internet connection.');
        default:
          throw new Error(authErr.message || 'Authentication failed.');
      }
    }
  }

  public async logout(): Promise<void> {
    this.currentSession = null;
    await signOut(auth);
    this.listeners.forEach((callback) => callback(null));
  }

  public async getSession(): Promise<AdminSession | null> {
    const user = auth.currentUser;
    if (user) {
      this.currentSession = await this.buildSession(user);
      return this.currentSession;
    }
    return null;
  }

  public onAuthStateChanged(
    callback: (session: AdminSession | null) => void
  ): () => void {
    this.listeners.add(callback);

    const unsubscribe = firebaseOnAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const session = await this.buildSession(user);
          this.currentSession = session;
          callback(session);
        } catch {
          this.currentSession = null;
          callback(null);
        }
      } else {
        this.currentSession = null;
        callback(null);
      }
    });

    return () => {
      this.listeners.delete(callback);
      unsubscribe();
    };
  }
}

export const authService: AuthService = new FirebaseAuthService();
