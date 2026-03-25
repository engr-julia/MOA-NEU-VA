import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMOAs } from '../hooks/useMOAs';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileWarning,
  FileText,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar as CalendarIcon,
  Upload,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import MOAForm from './MOAForm';
import PreviewModal from '../components/PreviewModal';
import MOADetailModal from '../components/MOADetailModal';
import LoadingSpinner from '../components/LoadingSpinner';

import { seedMockMOAs } from '../utils/seedData';
import { Database } from 'lucide-react';
import { MOARecord } from '../hooks/useMOAs';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { moas, loading, error } = useMOAs();
  const { profile } = useAuth();
  const [filterCollege, setFilterCollege] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedMOA, setSelectedMOA] = useState<MOARecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Auto-seed if superadmin and collection is empty
  React.useEffect(() => {
    if (profile?.role === 'superadmin') {
      seedMockMOAs();
    }
  }, [profile]);

  const handleSeed = async (force = false) => {
    setIsSeeding(true);
    await seedMockMOAs(force);
    setIsSeeding(false);
  };

  // Fetch recent uploads for admins
  React.useEffect(() => {
    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') return;

    const q = query(collection(db, 'moaFiles'), orderBy('uploadedAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentUploads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredMoas = useMemo(() => {
    return moas.filter(m => {
      const matchesCollege = filterCollege === 'All' || m.college === filterCollege;
      
      let matchesDate = true;
      if (startDate && endDate && m.effectiveDate && typeof m.effectiveDate.toDate === 'function') {
        const date = m.effectiveDate.toDate();
        matchesDate = isWithinInterval(date, {
          start: startOfDay(new Date(startDate)),
          end: endOfDay(new Date(endDate))
        });
      }

      return matchesCollege && matchesDate;
    });
  }, [moas, filterCollege, startDate, endDate]);

  const stats = useMemo(() => {
    const active = filteredMoas.filter(m => m.status?.startsWith('APPROVED') && !m.deleted).length;
    const processing = filteredMoas.filter(m => m.status?.startsWith('PROCESSING') && !m.deleted).length;
    const expired = filteredMoas.filter(m => m.status?.startsWith('EXPIRED') && !m.deleted).length;
    const expiring = filteredMoas.filter(m => m.status?.startsWith('EXPIRING') && !m.deleted).length;

    return { active, processing, expired, expiring };
  }, [filteredMoas]);

  const chartData = [
    { name: 'Approved', value: stats.active, color: '#059669' },
    { name: 'Processing', value: stats.processing, color: '#0284c7' },
    { name: 'Expired', value: stats.expired, color: '#dc2626' },
    { name: 'Expiring', value: stats.expiring, color: '#d97706' },
  ];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuickFile(file);
      setIsFormOpen(true);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
      <AlertCircle size={48} className="text-red-500" />
      <h2 className="text-xl font-bold text-slate-800">Error Loading Dashboard</h2>
      <p className="text-slate-500 max-w-md">{error.message}</p>
    </div>
  );

  // Role-based Dashboard Views
  if (profile?.role === 'admin' || profile?.role === 'superadmin') {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{profile?.role === 'superadmin' ? 'Superadmin Dashboard' : 'Admin Command Center'}</h1>
            <p className="text-slate-500">Full oversight of MOA records and system activity.</p>
          </div>
          <div className="flex items-center gap-4">
            {profile?.role === 'superadmin' && (
              <button 
                onClick={() => handleSeed(true)}
                disabled={isSeeding}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <Database size={14} />
                {isSeeding ? 'Refreshing...' : 'Refresh Mock Data'}
              </button>
            )}
            <DashboardFilters 
              filterCollege={filterCollege} 
              setFilterCollege={setFilterCollege}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          </div>
        </header>

        <QuickActionBanner onUpload={handleQuickUpload} navigate={navigate} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active MOAs" value={stats.active} icon={CheckCircle2} color="emerald" trend="+2.5%" />
          <StatCard title="Processing" value={stats.processing} icon={Clock} color="blue" trend="+1.2%" />
          <StatCard title="Expiring Soon" value={stats.expiring} icon={AlertCircle} color="amber" trend="-0.5%" />
          <StatCard title="Expired" value={stats.expired} icon={FileWarning} color="red" trend="+0.8%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StatusChart data={chartData} />
          <CompositionChart data={chartData} />
        </div>

        <RecentUploads 
          uploads={recentUploads} 
          onPreview={(url: string, name: string) => setPreviewFile({ url, name })} 
        />

        <PreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          url={previewFile?.url || ''}
          fileName={previewFile?.name}
        />

        {isFormOpen && (
          <MOAForm 
            onClose={() => {
              setIsFormOpen(false);
              setQuickFile(null);
            }} 
            quickFile={quickFile || undefined}
          />
        )}
      </div>
    );
  }

  if (profile?.role === 'faculty') {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Faculty Dashboard</h1>
            <p className="text-slate-500">Manage and monitor MOAs for your department.</p>
          </div>
          <DashboardFilters 
            filterCollege={filterCollege} 
            setFilterCollege={setFilterCollege}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        </header>

        {profile.role === 'faculty' && <QuickActionBanner onUpload={handleQuickUpload} navigate={navigate} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active MOAs" value={stats.active} icon={CheckCircle2} color="emerald" trend="+2.5%" />
          <StatCard title="Processing" value={stats.processing} icon={Clock} color="blue" trend="+1.2%" />
          <StatCard title="Expiring Soon" value={stats.expiring} icon={AlertCircle} color="amber" trend="-0.5%" />
          <StatCard title="Expired" value={stats.expired} icon={FileWarning} color="red" trend="+0.8%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StatusChart data={chartData} />
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Need to add a record?</h3>
            <p className="text-slate-500 mb-6 max-w-xs">Use the quick upload or go to the MOA list to manually enter new partnership details.</p>
            <button 
              onClick={() => navigate('/moas')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
            >
              Go to MOA Records
            </button>
          </div>
        </div>

        {isFormOpen && (
          <MOAForm 
            onClose={() => {
              setIsFormOpen(false);
              setQuickFile(null);
            }} 
            quickFile={quickFile || undefined}
          />
        )}
      </div>
    );
  }

  if (profile?.role === 'student') {
    const activeMoas = moas.filter(m => m.status?.startsWith('APPROVED') && !m.deleted).slice(0, 3);

    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Student Portal</h1>
            <p className="text-slate-500">Browse active institutional partnerships and MOAs.</p>
          </div>
        </header>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2rem] p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Find your next internship</h2>
          <p className="text-emerald-50/80 mb-8 max-w-xl text-lg">
            Access the list of approved and active MOAs to see which companies are currently partnered with NEU for your college.
          </p>
          <button 
            onClick={() => navigate('/moas')}
            className="px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-xl"
          >
            Browse Active MOAs
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{stats.active}</h3>
            <p className="text-slate-500 text-sm">Active Partnerships</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Updated Daily</h3>
            <p className="text-slate-500 text-sm">Real-time Records</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Verified</h3>
            <p className="text-slate-500 text-sm">Institutional Approval</p>
          </div>
        </div>

        {activeMoas.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Featured Partnerships</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeMoas.map(moa => (
                <div key={moa.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-800 truncate">{moa.companyName}</h4>
                      <p className="text-xs text-emerald-600 font-medium">{moa.college}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{moa.address}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{moa.industryType}</span>
                    <button 
                      onClick={() => {
                        setSelectedMOA(moa);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <MOADetailModal 
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          moa={selectedMOA}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
      <AlertCircle size={48} className="text-slate-300" />
      <p className="text-slate-500">Dashboard not available for your current role.</p>
    </div>
  );
};

// Sub-components for cleaner structure
const DashboardFilters = ({ filterCollege, setFilterCollege, startDate, setStartDate, endDate, setEndDate }: any) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
      <select 
        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        value={filterCollege}
        onChange={(e) => setFilterCollege(e.target.value)}
      >
        <option value="All">All Colleges</option>
        <option value="CAS">CAS</option>
        <option value="CBA">CBA</option>
        <option value="CCJE">CCJE</option>
        <option value="CED">CED</option>
        <option value="CEIT">CEIT</option>
        <option value="CHM">CHM</option>
        <option value="CON">CON</option>
      </select>
    </div>

    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
      <CalendarIcon size={14} className="text-slate-400" />
      <input 
        type="date" 
        className="text-xs focus:outline-none" 
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <span className="text-slate-300">-</span>
      <input 
        type="date" 
        className="text-xs focus:outline-none" 
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
    </div>
  </div>
);

const QuickActionBanner = ({ onUpload, navigate }: any) => (
  <div className="bg-emerald-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="max-w-md">
        <h2 className="text-3xl font-bold mb-3">Quick MOA Entry</h2>
        <p className="text-emerald-100/80 mb-6">
          Upload your MOA document directly to start a new entry. We'll attach it automatically for you.
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="px-6 py-3 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-2 shadow-xl shadow-black/10">
            <Upload size={18} />
            Upload Entry
            <input type="file" className="hidden" onChange={onUpload} accept=".pdf,image/*" />
          </label>
          <button 
            onClick={() => navigate('/moas')}
            className="px-6 py-3 bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all border border-white/10"
          >
            View All Records
          </button>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm">
          <FileWarning size={80} className="text-emerald-300/50" />
        </div>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
  </div>
);

const StatusChart = ({ data }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
    <h3 className="text-lg font-bold text-slate-800 mb-6">Status Distribution</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const CompositionChart = ({ data }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
    <h3 className="text-lg font-bold text-slate-800 mb-6">MOA Composition</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex justify-center gap-4 mt-4">
      {data.map((item: any) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-slate-500">{item.name}</span>
        </div>
      ))}
    </div>
  </div>
);

const RecentUploads = ({ uploads, onPreview }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-bold text-slate-800">Recent MOA Uploads</h3>
      <span className="text-xs text-slate-400 font-medium">Last 5 activities</span>
    </div>
    <div className="space-y-4">
      {uploads.length === 0 ? (
        <p className="text-center py-8 text-slate-400 text-sm italic">No recent uploads found.</p>
      ) : (
        uploads.map((upload: any) => (
          <div key={upload.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{upload.fileName}</p>
                <p className="text-[10px] text-slate-500">{upload.uploadedBy} • {upload.uploadedAt && typeof upload.uploadedAt.toDate === 'function' ? format(upload.uploadedAt.toDate(), 'MMM dd, h:mm a') : 'Just now'}</p>
              </div>
            </div>
            <button 
              onClick={() => onPreview(upload.fileURL, upload.fileName)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all"
            >
              View File
            </button>
          </div>
        ))
      )}
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <h4 className="text-3xl font-bold text-slate-800">{value}</h4>
        <div className={`flex items-center gap-1 text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend.startsWith('+') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
