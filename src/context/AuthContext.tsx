import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, addDoc, Timestamp, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'student' | 'faculty' | 'admin' | 'superadmin';
  canEdit: boolean;
  canManageUsers: boolean;
  isBlocked: boolean;
  bio?: string;
  phoneNumber?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: Timestamp;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  if (authError) throw authError;

  const logUserEvent = async (u: FirebaseUser, p: UserProfile, event: 'login' | 'logout' | 'profile_update', details: string) => {
    try {
      await addDoc(collection(db, 'userLogs'), {
        userId: u.uid,
        userName: p.displayName || u.displayName || 'Unknown',
        email: u.email,
        role: p.role,
        timestamp: Timestamp.now(),
        event,
        details
      });
    } catch (error) {
      console.error('Failed to log user event:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('onAuthStateChanged - User:', firebaseUser ? firebaseUser.uid : 'null');
      
      if (firebaseUser && firebaseUser.email && !firebaseUser.email.endsWith('@neu.edu.ph')) {
        await signOut(auth);
        setLoginError('Only @neu.edu.ph accounts are allowed.');
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('AuthContext useEffect[user] - User:', user ? user.uid : 'null');
    if (!user) return;

    let unsubscribeProfile: (() => void) | undefined;

    const syncProfile = async (user: FirebaseUser) => {
      console.log('Syncing profile for user:', user.uid);
      try {
        const userRef = doc(db, 'users', user.uid);
        
        // Use getDocFromServer for initial check to ensure we have the latest data
        let userSnap;
        try {
          userSnap = await getDocFromServer(userRef);
        } catch (err) {
          console.warn('getDocFromServer failed, falling back to cache:', err);
          // If server is unreachable, we might still have it in cache or onSnapshot will catch it
        }

        let currentProfile: UserProfile;

        if (userSnap && userSnap.exists()) {
          console.log('Profile found in Firestore:', userSnap.data().role);
          currentProfile = userSnap.data() as UserProfile;
          setProfile(currentProfile);
          
          // Update last login
          await updateDoc(userRef, {
            lastLogin: Timestamp.now()
          });
          
          await logUserEvent(user, currentProfile, 'login', 'User logged in');
        } else {
          // Create new profile if it doesn't exist
          console.log('No profile found, creating new student profile');
          currentProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || '',
            role: (['julia.rodrigo@neu.edu.ph', 'jcesperanza@neu.edu.ph'].includes(user.email?.toLowerCase() || '')) ? 'superadmin' : 'student',
            isBlocked: false,
            canEdit: false,
            canManageUsers: (['julia.rodrigo@neu.edu.ph', 'jcesperanza@neu.edu.ph'].includes(user.email?.toLowerCase() || '')),
            termsAccepted: false,
            createdAt: Timestamp.now(),
            lastLogin: Timestamp.now(),
          };

          await setDoc(userRef, currentProfile);
          setProfile(currentProfile);
          await logUserEvent(user, currentProfile, 'login', 'First time login or profile recovery - Profile created');
        }

        setLoading(false);

        // Set up real-time listener for profile changes
        const unsubscribe = onSnapshot(userRef, 
          (doc) => {
            if (doc.exists()) {
              const data = doc.data() as UserProfile;
              setProfile(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                return data;
              });
            }
          }, 
          (error) => {
            console.error('Error in profile onSnapshot:', error);
            // Don't throw here to avoid crashing the whole app if just the profile listener fails
            // but we already have the initial profile data
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error in syncProfile:', error);
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        } catch (e) {
          setAuthError(e as Error);
        }
      }
    };

    syncProfile(user).then(unsub => {
      unsubscribeProfile = unsub;
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user]);

  const login = async () => {
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('The login window was closed before completion. Please try again.');
      } else if (error.code === 'auth/cancelled-by-user') {
        setLoginError('Login was cancelled. Please try again.');
      } else {
        setLoginError(`Login failed: ${error.code || 'Unknown error'}. Please check Firebase Authorized Domains.`);
      }
    }
  };

  const logout = async () => {
    if (user && profile) {
      await logUserEvent(user, profile, 'logout', 'User logged out');
    }
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Destructure to separate sensitive fields from safe fields
      // This prevents users (even admins) from accidentally changing their own role/status
      // via the general profile update mechanism.
      const { role, isBlocked, canEdit, email, uid, createdAt, ...safeData } = data as any;
      
      if (Object.keys(safeData).length === 0) return;

      await updateDoc(userRef, safeData);
      await logUserEvent(user, profile, 'profile_update', `Updated: ${Object.keys(safeData).join(', ')}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfile, loginError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
