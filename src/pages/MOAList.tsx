import React, { useState, useMemo, useEffect } from 'react';
import { useMOAs, MOARecord } from '../hooks/useMOAs';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  RotateCcw,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import MOAForm from './MOAForm';
import PreviewModal from '../components/PreviewModal';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSpinner from '../components/LoadingSpinner';

const MOAList: React.FC = () => {
  const { moas, loading, error, deleteMOA, restoreMOA } = useMOAs();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCollege, setFilterCollege] = useState('All');
  const [filterIndustry, setFilterIndustry] = useState('All');
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMOA, setEditingMOA] = useState<MOARecord | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; moa: MOARecord | null; isPermanent: boolean }>({
    isOpen: false,
    moa: null,
    isPermanent: false
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof MOARecord; direction: 'asc' | 'desc' } | null>(null);

  const sortedAndFilteredMOAs = useMemo(() => {
    let result = moas.filter(moa => {
      const matchesSearch = 
        moa.companyName.toLowerCase().includes(search.toLowerCase()) ||
        moa.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        moa.address.toLowerCase().includes(search.toLowerCase()) ||
        moa.college.toLowerCase().includes(search.toLowerCase()) ||
        moa.industryType.toLowerCase().includes(search.toLowerCase()) ||
        moa.hteId?.toLowerCase().includes(search.toLowerCase()) ||
        moa.status?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCollege = filterCollege === 'All' || moa.college === filterCollege;
      const matchesIndustry = filterIndustry === 'All' || moa.industryType === filterIndustry;
      const matchesExpiring = !filterExpiring || moa.status?.startsWith('EXPIRING');

      return matchesSearch && matchesCollege && matchesIndustry && matchesExpiring;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

        // Handle Timestamps
        if (sortConfig.key === 'effectiveDate' || sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
          const aTime = (aValue as any).seconds || 0;
          const bTime = (bValue as any).seconds || 0;
          return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [moas, search, filterCollege, filterIndustry, filterExpiring, sortConfig]);

  const handleSort = (key: keyof MOARecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof MOARecord }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-emerald-600" /> : <ArrowDown size={14} className="ml-1 text-emerald-600" />;
  };

  const [quickFile, setQuickFile] = useState<File | null>(null);

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuickFile(file);
      setEditingMOA(null);
      setIsFormOpen(true);
    }
  };

  useEffect(() => {
    const handleGlobalDrop = (e: any) => {
      const file = e.detail;
      if (file) {
        setQuickFile(file);
        setEditingMOA(null);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('global_file_drop', handleGlobalDrop);
    return () => window.removeEventListener('global_file_drop', handleGlobalDrop);
  }, []);

  const canEdit = profile?.role === 'admin' || profile?.role === 'superadmin' || (profile?.role === 'faculty' && profile?.canEdit);

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Error Loading MOA Records</h2>
      <p className="text-slate-500 max-w-md">{error.message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by college, industry, status, person, company, or address..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
            <Filter size={14} className={filterExpiring ? 'text-emerald-600' : 'text-slate-400'} />
            Expiring Only
            <input 
              type="checkbox" 
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              checked={filterExpiring}
              onChange={(e) => setFilterExpiring(e.target.checked)}
            />
          </label>

          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
            value={filterCollege}
            onChange={(e) => setFilterCollege(e.target.value)}
          >
            <option>All Colleges</option>
            <option>CAS</option>
            <option>CBA</option>
            <option>CCJE</option>
            <option>CED</option>
            <option>CEIT</option>
            <option>CHM</option>
            <option>CON</option>
          </select>

          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
          >
            <option value="All">All Industries</option>
            <option value="Information Technology">IT</option>
            <option value="Business Services">Business</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Construction">Construction</option>
            <option value="Media & Arts">Media & Arts</option>
          </select>

          {canEdit && (
            <div className="flex items-center gap-2">
              <label className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
                <Plus size={18} />
                Upload Entry
                <input type="file" className="hidden" onChange={handleQuickUpload} accept="image/jpeg" />
              </label>
              <button
                onClick={() => {
                  setQuickFile(null);
                  setEditingMOA(null);
                  setIsFormOpen(true);
                }}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm"
              >
                Manual Entry
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th 
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center">
                    Company
                    <SortIcon columnKey="companyName" />
                  </div>
                </th>
                {profile?.role !== 'student' && (
                  <th 
                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('hteId')}
                  >
                    <div className="flex items-center">
                      HTE ID
                      <SortIcon columnKey="hteId" />
                    </div>
                  </th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                {profile?.role !== 'student' && (
                  <>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Industry & Endorsed by College</th>
                    <th 
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('effectiveDate')}
                    >
                      <div className="flex items-center">
                        Effective Date
                        <SortIcon columnKey="effectiveDate" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </>
                )}
                {profile?.role !== 'student' && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndFilteredMOAs.map((moa) => {
                const isExpiring = moa.status?.includes('EXPIRING');
                const isExpired = moa.status?.includes('EXPIRED');
                const highlightClass = isExpired ? 'bg-red-50/50' : isExpiring ? 'bg-amber-50/50' : '';

                return (
                  <tr key={moa.id} className={`hover:bg-slate-50/50 transition-colors ${highlightClass} ${moa.deleted ? 'opacity-60 bg-slate-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(isExpired || isExpiring) && (
                          <AlertTriangle size={16} className={isExpired ? 'text-red-500' : 'text-amber-500'} />
                        )}
                        <div className="font-semibold text-slate-800">{moa.companyName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {moa.documentUrl && (
                        <button
                          onClick={() => setPreviewFile({ url: moa.documentUrl!, name: moa.companyName })}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-2"
                          title="Preview Document"
                        >
                          <Eye size={16} />
                          <span className="text-xs font-bold">View</span>
                        </button>
                      )}
                    </td>
                    {profile?.role !== 'student' && (
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600 font-mono">{moa.hteId || 'N/A'}</div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 max-w-xs truncate">{moa.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{moa.contactPerson}</div>
                      <div className="text-xs text-slate-400">{moa.contactEmail}</div>
                    </td>
                    {profile?.role !== 'student' && (
                      <>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">{moa.industryType}</div>
                          <div className="text-xs font-medium text-emerald-600">{moa.college}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar size={14} className="text-slate-400" />
                            {moa.effectiveDate && typeof moa.effectiveDate.toDate === 'function' ? format(moa.effectiveDate.toDate(), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={moa.status} />
                          {moa.deleted && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">Deleted</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && !moa.deleted && (
                              <button 
                                onClick={() => {
                                  setEditingMOA(moa);
                                  setIsFormOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Record"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canEdit && (
                              <button 
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    moa: moa,
                                    isPermanent: moa.deleted
                                  });
                                }}
                                className={`p-2 rounded-lg transition-all ${
                                  moa.deleted 
                                    ? 'text-red-700 hover:bg-red-100' 
                                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={moa.deleted ? 'Permanent Delete' : 'Soft Delete'}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {(profile?.role === 'admin' || profile?.role === 'superadmin') && moa.deleted && (
                              <button 
                                onClick={() => restoreMOA(moa.id)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Restore Record"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {sortedAndFilteredMOAs.map((moa) => (
            <div key={moa.id} className={`p-6 space-y-4 ${moa.deleted ? 'opacity-60 bg-slate-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800">{moa.companyName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{moa.hteId}</p>
                </div>
                <StatusBadge status={moa.status} />
              </div>
              
              {moa.documentUrl && (
                <button
                  onClick={() => setPreviewFile({ url: moa.documentUrl!, name: moa.companyName })}
                  className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-emerald-100"
                >
                  <Eye size={18} /> Preview Document
                </button>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                  <p className="text-slate-600">{moa.contactPerson}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Effective Date</p>
                  <p className="text-slate-600">
                    {moa.effectiveDate && typeof moa.effectiveDate.toDate === 'function' ? format(moa.effectiveDate.toDate(), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Endorsed by College</p>
                  <p className="text-emerald-600 font-medium">{moa.college}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Industry</p>
                  <p className="text-slate-600">{moa.industryType}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {canEdit && !moa.deleted && (
                  <button 
                    onClick={() => {
                      setEditingMOA(moa);
                      setIsFormOpen(true);
                    }}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}
                {canEdit && (
                  <button 
                    onClick={() => {
                      setDeleteConfirm({
                        isOpen: true,
                        moa: moa,
                        isPermanent: moa.deleted
                      });
                    }}
                    className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${
                      moa.deleted ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    <Trash2 size={14} /> {moa.deleted ? 'Permanent Delete' : 'Delete'}
                  </button>
                )}
                {(profile?.role === 'admin' || profile?.role === 'superadmin') && moa.deleted && (
                  <button 
                    onClick={() => restoreMOA(moa.id)}
                    className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isFormOpen && (
        <MOAForm 
          onClose={() => {
            setIsFormOpen(false);
            setQuickFile(null);
          }} 
          initialData={editingMOA || undefined} 
          quickFile={quickFile || undefined}
        />
      )}

      <PreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        url={previewFile?.url || ''}
        fileName={previewFile?.name}
      />

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={() => {
          if (deleteConfirm.moa) {
            deleteMOA(deleteConfirm.moa);
          }
        }}
        title={deleteConfirm.isPermanent ? 'Permanent Deletion' : 'Delete Record'}
        message={
          deleteConfirm.isPermanent 
            ? `Are you sure you want to PERMANENTLY delete the MOA for ${deleteConfirm.moa?.companyName}? This will also remove all related audit logs and files. This action cannot be undone.`
            : `Are you sure you want to move the MOA for ${deleteConfirm.moa?.companyName} to the trash? You can restore it later if needed.`
        }
        confirmText={deleteConfirm.isPermanent ? 'Permanently Delete' : 'Move to Trash'}
        type="danger"
      />
    </div>
  );
};

const StatusBadge = ({ status }: { status: MOARecord['status'] }) => {
  const getStyle = () => {
    if (!status) return 'bg-slate-50 text-slate-700 border-slate-100';
    if (status.startsWith('APPROVED')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status.startsWith('PROCESSING')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (status.startsWith('EXPIRED')) return 'bg-red-50 text-red-700 border-red-100';
    if (status.startsWith('EXPIRING')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStyle()}`}>
      {status || 'UNKNOWN'}
    </span>
  );
};

export default MOAList;
