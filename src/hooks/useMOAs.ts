import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, orderBy, Timestamp, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface MOARecord {
  id: string;
  hteId: string;
  companyName: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  industryType: string;
  effectiveDate: Timestamp;
  status: 
    | 'APPROVED: Signed by President'
    | 'APPROVED: Ongoing Notarization'
    | 'APPROVED: No Notarization Needed'
    | 'PROCESSING: Awaiting signature of the MOA draft by HTE partner'
    | 'PROCESSING: MOA draft sent to Legal Office for review'
    | 'PROCESSING: MOA draft and legal opinion sent to VPAA/OP for approval'
    | 'EXPIRED: No renewal done'
    | 'EXPIRING: Two months before expiration date';
  college: string;
  documentUrl?: string;
  deleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  operation: 'INSERT' | 'EDIT' | 'SOFT DELETE' | 'RECOVER' | 'PERMANENT DELETE';
  recordId: string;
  details: string;
}

import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { deleteDoc, writeBatch, getDocs, query as fsQuery } from 'firebase/firestore';

export const useMOAs = () => {
  const { profile } = useAuth();
  const [moas, setMoas] = useState<MOARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // if (error) throw error; // Removed to prevent crashing the component tree

  useEffect(() => {
    if (!profile) return;

    setLoading(true);
    setError(null);

    // Filter by deleted=false for non-admins to satisfy security rules
    let q = query(collection(db, 'moas'));
    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      q = query(collection(db, 'moas'), where('deleted', '==', false));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MOARecord));
      
      // Perform additional filtering client-side
      let filteredData = allData;

      if (profile.role === 'student') {
        // Students only see approved MOAs
        filteredData = allData.filter(m => m.status?.startsWith('APPROVED'));
      }
      // Faculty sees all non-deleted (already filtered by query)
      // Admin continues to see all (including deleted)

      setMoas(filteredData);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      try {
        handleFirestoreError(err, OperationType.LIST, 'moas');
      } catch (e) {
        setError(e as Error);
      }
    });

    return () => unsubscribe();
  }, [profile]);

  const addMOA = async (data: Omit<MOARecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'deleted'>) => {
    if (!profile) return null;
    try {
      const docRef = await addDoc(collection(db, 'moas'), {
        ...data,
        deleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: profile.uid
      });

      await addDoc(collection(db, 'auditLogs'), {
        userId: profile.uid,
        userName: profile.displayName,
        timestamp: Timestamp.now(),
        operation: 'INSERT',
        recordId: docRef.id,
        details: `Inserted MOA for ${data.companyName}`
      });
      return docRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'moas/auditLogs');
      return null;
    }
  };

  const updateMOA = async (id: string, data: Partial<MOARecord>) => {
    if (!profile) return;
    try {
      const moaRef = doc(db, 'moas', id);
      await updateDoc(moaRef, {
        ...data,
        updatedAt: Timestamp.now()
      });

      await addDoc(collection(db, 'auditLogs'), {
        userId: profile.uid,
        userName: profile.displayName,
        timestamp: Timestamp.now(),
        operation: 'EDIT',
        recordId: id,
        details: `Edited MOA fields: ${Object.keys(data).join(', ')}`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `moas/${id}`);
    }
  };

  const deleteMOA = async (moa: MOARecord) => {
    if (!profile) return;
    
    if (!moa.deleted) {
      // Stage 1: Soft Delete
      try {
        const moaRef = doc(db, 'moas', moa.id);
        await updateDoc(moaRef, {
          deleted: true,
          deletedAt: Timestamp.now(),
          deletedBy: profile.uid,
          updatedAt: Timestamp.now()
        });

        await addDoc(collection(db, 'auditLogs'), {
          userId: profile.uid,
          userName: profile.displayName,
          timestamp: Timestamp.now(),
          operation: 'SOFT DELETE',
          recordId: moa.id,
          details: `Soft deleted MOA for ${moa.companyName}`
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `moas/${moa.id}`);
      }
    } else if (profile.role === 'admin' || profile.role === 'superadmin') {
      // Stage 2: Permanent Delete
      try {
        const batch = writeBatch(db);
        
        // 1. Delete MOA document
        batch.delete(doc(db, 'moas', moa.id));
        
        // 2. Delete related audit trail entries
        const auditLogsQuery = fsQuery(collection(db, 'auditLogs'), where('recordId', '==', moa.id));
        const auditLogsSnap = await getDocs(auditLogsQuery);
        auditLogsSnap.forEach(d => batch.delete(d.ref));
        
        // 3. Delete related moaFiles entries
        const moaFilesQuery = fsQuery(collection(db, 'moaFiles'), where('relatedMOA', '==', moa.id));
        const moaFilesSnap = await getDocs(moaFilesQuery);
        moaFilesSnap.forEach(d => batch.delete(d.ref));

        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `moas/${moa.id}`);
      }
    }
  };

  const restoreMOA = async (id: string) => {
    if (!profile) return;
    try {
      const moaRef = doc(db, 'moas', id);
      await updateDoc(moaRef, {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        updatedAt: Timestamp.now()
      });

      await addDoc(collection(db, 'auditLogs'), {
        userId: profile.uid,
        userName: profile.displayName,
        timestamp: Timestamp.now(),
        operation: 'RECOVER',
        recordId: id,
        details: `Recovered MOA`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `moas/${id}`);
    }
  };

  return { moas, loading, error, addMOA, updateMOA, deleteMOA, restoreMOA };
};
