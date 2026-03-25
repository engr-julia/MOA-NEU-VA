import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  History, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Activity,
  HelpCircle,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UserGuide from './UserGuide';
import LoadingSpinner from './LoadingSpinner';

const Layout: React.FC = () => {
  const { profile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (profile?.role !== 'student') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && profile?.role !== 'student') {
      // Store file in session storage or state to pass to MOA list
      const reader = new FileReader();
      reader.onload = () => {
        // We can't easily pass the File object through navigation state in some cases,
        // so we'll use a custom event or redirect with a flag
        sessionStorage.setItem('pending_upload_file', file.name);
        // In a real app, we'd upload here or use a global state manager
        // For this demo, we'll redirect to MOA list which will handle the "pending" file
        navigate('/moas', { state: { quickUpload: true } });
        // Dispatch a custom event that MOAList can listen to
        window.dispatchEvent(new CustomEvent('global_file_drop', { detail: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Show guide automatically on first visit
  React.useEffect(() => {
    const hasSeenGuide = localStorage.getItem('moaneuva_guide_seen');
    if (!hasSeenGuide) {
      setIsGuideOpen(true);
      localStorage.setItem('moaneuva_guide_seen', 'true');
    }
  }, []);

  if (!profile) return <LoadingSpinner />;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['student', 'faculty', 'admin', 'superadmin'] },
    { name: 'MOA Records', icon: FileText, path: '/moas', roles: ['student', 'faculty', 'admin', 'superadmin'] },
    { name: 'User Management', icon: Users, path: '/users', roles: ['superadmin'] },
    { name: 'Audit Trail', icon: History, path: '/audit', roles: ['admin', 'superadmin'] },
    { name: 'User Activity', icon: Activity, path: '/activity', roles: ['admin', 'superadmin'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (!profile) return false;
    if (profile.role === 'superadmin') return true;
    return item.roles.includes(profile.role);
  });

  return (
    <div 
      className="min-h-screen bg-[#f8fafc] flex"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-8"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border-4 border-dashed border-white/40">
                <Upload size={64} className="animate-bounce" />
              </div>
              <div>
                <h2 className="text-4xl font-black mb-2">Drop to Upload MOA</h2>
                <p className="text-emerald-100 text-xl">Instantly start a new record entry</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:static inset-y-0 left-0 w-72 bg-[#064e3b] z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                <span className="font-bold text-white text-lg tracking-tight">MOANEUVA</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-emerald-200">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
              {filteredMenu.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-white/10 text-white font-medium border border-white/10' 
                        : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-emerald-100/60 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center px-6 sticky top-0 z-40">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 mr-4">
              <Menu size={20} />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              {menuItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
          >
            <HelpCircle size={20} />
            <span className="hidden sm:inline">User Guide</span>
          </button>
          
          <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{profile?.displayName}</p>
              <p className="text-xs text-emerald-600 capitalize">{profile?.role}</p>
            </div>
            <img src={profile?.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-emerald-500/30 shadow-sm" />
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      {isGuideOpen && <UserGuide onClose={() => setIsGuideOpen(false)} />}
    </div>
  );
};

export default Layout;
