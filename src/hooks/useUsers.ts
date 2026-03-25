import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'student' | 'faculty' | 'admin' | 'superadmin';
  canEdit: boolean;
  canManageUsers: boolean;
  isBlocked: boolean;
}

import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export const useUsers = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  if (error) throw error;

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id // Ensure uid is always the document ID
      } as UserProfile));
      setUsers(data);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      try {
        handleFirestoreError(err, OperationType.LIST, 'users');
      } catch (e) {
        setError(e as Error);
      }
    });

    return () => unsubscribe();
  }, [profile]);

  const updateUserRole = async (uid: string, role: UserProfile['role']) => {
    if (uid === profile?.uid) {
      console.error('You cannot modify your own role.');
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      const updates: Partial<UserProfile> = { role };
      
      // Sync permissions based on role
      if (role === 'superadmin') {
        updates.canManageUsers = true;
        updates.canEdit = true;
      } else if (role === 'admin') {
        updates.canManageUsers = false; // Only superadmins can manage users now as per previous request
        updates.canEdit = true;
      } else if (role === 'student') {
        updates.canManageUsers = false;
        updates.canEdit = false;
      }
      
      await updateDoc(userRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateUserPermission = async (uid: string, canEdit: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { canEdit });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateUserManagePermission = async (uid: string, canManageUsers: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { canManageUsers });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateUserStatus = async (uid: string, isBlocked: boolean) => {
    if (uid === profile?.uid) {
      console.error('You cannot block yourself.');
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { isBlocked });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const syncUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      for (const userDoc of snapshot.docs) {
        const data = userDoc.data() as UserProfile;
        const updates: Partial<UserProfile> = {};
        
        if (data.role === 'superadmin') {
          if (!data.canManageUsers) updates.canManageUsers = true;
          if (!data.canEdit) updates.canEdit = true;
        } else if (data.role === 'admin') {
          if (data.canManageUsers) updates.canManageUsers = false;
          if (!data.canEdit) updates.canEdit = true;
        } else if (data.role === 'student') {
          if (data.canManageUsers) updates.canManageUsers = false;
          if (data.canEdit) updates.canEdit = false;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(userDoc.ref, updates);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/sync');
    }
  };

  return { users, loading, updateUserRole, updateUserPermission, updateUserManagePermission, updateUserStatus, syncUsers };
};
