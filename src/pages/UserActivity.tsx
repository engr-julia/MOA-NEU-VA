import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Activity, User, Clock, Info, Shield, LogIn, LogOut, Edit } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import LoadingSpinner from '../components/LoadingSpinner';

interface UserLog {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  timestamp: any;
  event: 'login' | 'logout' | 'profile_update';
  details: string;
}

const UserActivity: React.FC = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') return;

    const q = query(
      collection(db, 'userLogs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserLog));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'userLogs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  if (!profile) return <LoadingSpinner />;
  if (profile.role !== 'admin' && profile.role !== 'superadmin') return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;
  if (loading) return <LoadingSpinner />;

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'login': return <LogIn size={16} className="text-emerald-500" />;
      case 'logout': return <LogOut size={16} className="text-slate-400" />;
      case 'profile_update': return <Edit size={16} className="text-blue-500" />;
      default: return <Info size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Activity Logs</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-500">
          <Activity size={16} />
          <span>Last 100 events</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      {log.timestamp ? format(log.timestamp.toDate(), 'MMM dd, HH:mm:ss') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{log.userName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Shield size={10} />
                          {log.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getEventIcon(log.event)}
                      <span className="text-sm font-medium capitalize text-slate-700">{(log.event || '').replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500 max-w-md truncate" title={log.details}>
                      {log.details}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getEventIcon(log.event)}
                  <span className="text-xs font-bold capitalize text-slate-700">{(log.event || '').replace('_', ' ')}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {log.timestamp ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{log.userName}</p>
                  <p className="text-[10px] text-slate-400">{log.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {logs.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-400">
            No activity logs found
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivity;
