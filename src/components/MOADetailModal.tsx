import React from 'react';
import { X, Building2, MapPin, User, Mail, Briefcase, Calendar, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOARecord } from '../hooks/useMOAs';
import { format } from 'date-fns';

interface MOADetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  moa: MOARecord | null;
}

const MOADetailModal: React.FC<MOADetailModalProps> = ({ isOpen, onClose, moa }) => {
  if (!moa) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Partnership Details</h3>
                  <p className="text-xs text-slate-500 font-mono">{moa.hteId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Building2 size={12} /> Company Name
                    </p>
                    <p className="font-semibold text-slate-800">{moa.companyName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Briefcase size={12} /> Industry
                    </p>
                    <p className="font-semibold text-slate-800">{moa.industryType}</p>
                  </div>
                  <div className="col-span-full space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} /> Office Address
                    </p>
                    <p className="font-semibold text-slate-800">{moa.address}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <User size={12} /> Contact Person
                    </p>
                    <p className="font-semibold text-slate-800">{moa.contactPerson}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail size={12} /> Email Address
                    </p>
                    <p className="font-semibold text-slate-800">{moa.contactEmail}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">MOA Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> Effective Date
                    </p>
                    <p className="font-semibold text-slate-800">
                      {moa.effectiveDate && typeof moa.effectiveDate.toDate === 'function' 
                        ? format(moa.effectiveDate.toDate(), 'MMMM dd, yyyy') 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Current Status
                    </p>
                    <div className="pt-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        moa.status?.startsWith('APPROVED') 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {moa.status}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {moa.documentUrl && (
                <div className="pt-4">
                  <a 
                    href={moa.documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                  >
                    <FileText size={18} />
                    View Signed MOA Document
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MOADetailModal;
