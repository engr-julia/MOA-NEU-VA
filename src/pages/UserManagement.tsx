import React, { useState } from 'react';
import { useUsers, UserProfile } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Shield, 
  UserCheck, 
  UserMinus, 
  Ban, 
  CheckCircle,
  Search,
  RefreshCw,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

const UserManagement: React.FC = () => {
  const { users, loading, updateUserRole, updateUserPermission, updateUserManagePermission, updateUserStatus, syncUsers } = useUsers();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAction = async (uid: string, action: () => Promise<void>) => {
    setProcessingId(uid);
    try {
      await action();
    } finally {
      setProcessingId(null);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncUsers();
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading || !profile) return <LoadingSpinner />;

  // Check if a user is a protected superadmin (e.g. the one from constants)
  const isProtectedUser = (user: UserProfile) => {
    // In a real app, we might have a list of protected emails or IDs
    // For now, let's just protect the current user and any superadmin from being blocked by others
    return user.uid === profile.uid;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500">Manage system access and permissions for all users.</p>
        </div>
        {profile.role === 'superadmin' && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all disabled:opacity-50 shadow-sm border border-emerald-100"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync All Permissions'}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none text-sm font-medium"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className={`hover:bg-slate-50/50 transition-colors ${processingId === user.uid ? 'opacity-50 pointer-events-none' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-100" />
                      <div>
                        <div className="font-semibold text-slate-800">{user.displayName}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className={`bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none ${isProtectedUser(user) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={user.role}
                      onChange={(e) => handleAction(user.uid, () => updateUserRole(user.uid, e.target.value as any))}
                      disabled={isProtectedUser(user)}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(user.uid, () => updateUserPermission(user.uid, !user.canEdit))}
                          disabled={user.role === 'superadmin' || user.role === 'admin'}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                            user.canEdit 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          } ${(user.role === 'superadmin' || user.role === 'admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {user.canEdit ? 'Can Edit MOAs' : 'View Only'}
                        </button>
                        
                        {profile.role === 'superadmin' && (
                          <button
                            onClick={() => handleAction(user.uid, () => updateUserManagePermission(user.uid, !user.canManageUsers))}
                            disabled={user.role === 'superadmin' || isProtectedUser(user)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                              user.canManageUsers 
                                ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            } ${(user.role === 'superadmin' || isProtectedUser(user)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {user.canManageUsers ? 'User Manager' : 'No User Mgmt'}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      !user.isBlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {user.isBlocked ? 'blocked' : 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAction(user.uid, () => updateUserStatus(user.uid, !user.isBlocked))}
                        disabled={isProtectedUser(user) || (user.role === 'superadmin' && profile.role !== 'superadmin')}
                        className={`p-2 rounded-lg transition-all ${
                          isProtectedUser(user) 
                            ? 'opacity-30 cursor-not-allowed' 
                            : !user.isBlocked 
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={isProtectedUser(user) ? 'You cannot block yourself' : (!user.isBlocked ? 'Block User' : 'Unblock User')}
                      >
                        {!user.isBlocked ? <Ban size={18} /> : <CheckCircle size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredUsers.map((user) => (
            <div key={user.uid} className={`p-6 space-y-4 ${processingId === user.uid ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3">
                <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full border border-slate-100 shadow-sm" />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-slate-800 truncate">{user.displayName}</h3>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  !user.isBlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {user.isBlocked ? 'blocked' : 'active'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Role</p>
                  <select
                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none ${isProtectedUser(user) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={user.role}
                    onChange={(e) => handleAction(user.uid, () => updateUserRole(user.uid, e.target.value as any))}
                    disabled={isProtectedUser(user)}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Permissions</p>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleAction(user.uid, () => updateUserPermission(user.uid, !user.canEdit))}
                      disabled={user.role === 'superadmin' || user.role === 'admin'}
                      className={`w-full py-1.5 rounded-lg text-[9px] font-bold transition-all border ${
                        user.canEdit 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      } ${(user.role === 'superadmin' || user.role === 'admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.canEdit ? 'Maintainer' : 'View Only'}
                    </button>
                    {profile.role === 'superadmin' && (
                      <button
                        onClick={() => handleAction(user.uid, () => updateUserManagePermission(user.uid, !user.canManageUsers))}
                        disabled={user.role === 'superadmin' || isProtectedUser(user)}
                        className={`w-full py-1.5 rounded-lg text-[9px] font-bold transition-all border ${
                          user.canManageUsers 
                            ? 'bg-purple-50 text-purple-600 border-purple-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        } ${(user.role === 'superadmin' || isProtectedUser(user)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {user.canManageUsers ? 'User Mgmt' : 'No User Mgmt'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleAction(user.uid, () => updateUserStatus(user.uid, !user.isBlocked))}
                  disabled={isProtectedUser(user)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isProtectedUser(user)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : !user.isBlocked 
                        ? 'bg-red-50 text-red-600' 
                        : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {isProtectedUser(user) ? (
                    'Self Account'
                  ) : !user.isBlocked ? (
                    <><Ban size={16} /> Block User</>
                  ) : (
                    <><CheckCircle size={16} /> Unblock User</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
