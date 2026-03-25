import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { AuditLog } from '../hooks/useMOAs';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { 
  History, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Search
} from 'lucide-react';

const AuditTrail: React.FC = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error('Error in AuditTrail onSnapshot:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredLogs = logs.filter(log => 
    (log.userName?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.details?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.operation?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const getIcon = (op: string) => {
    switch (op.toUpperCase()) {
      case 'INSERT': return <PlusCircle className="text-emerald-500" size={16} />;
      case 'EDIT': return <Edit3 className="text-blue-500" size={16} />;
      case 'SOFT DELETE': return <Trash2 className="text-red-500" size={16} />;
      case 'PERMANENT DELETE': return <Trash2 className="text-red-700" size={16} />;
      case 'RECOVER': return <RefreshCw className="text-amber-500" size={16} />;
      default: return <History className="text-slate-500" size={16} />;
    }
  };

  if (loading || !profile) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search logs by user or action..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {format(log.timestamp.toDate(), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.userId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getIcon(log.operation)}
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        {log.operation}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getIcon(log.operation)}
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    {log.operation}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {format(log.timestamp.toDate(), 'MMM dd, HH:mm')}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{log.userName}</p>
                <p className="text-xs text-slate-500 mt-1">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
