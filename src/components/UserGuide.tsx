import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, BookOpen, Shield, Users, FileText, CheckCircle } from 'lucide-react';

interface UserGuideProps {
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to MOANEUVA",
      content: "MOANEUVA: Streamlining Institutional Partnerships and MOA Management.",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      title: "Understanding Roles",
      content: "The app has three main roles: Students (view approved MOAs), Faculty (maintain records if permitted), and Admins (full management, audit logs, and user control).",
      icon: Users,
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "MOA Lifecycle",
      content: "Records move from PROCESSING (drafting/legal review) to APPROVED (signed/notarized). The app also tracks EXPIRING and EXPIRED records to ensure timely renewals.",
      icon: FileText,
      color: "text-amber-600 bg-amber-50"
    },
    {
      title: "Data Visibility",
      content: "Students can only see basic info (Company, Address, Contact) of APPROVED MOAs. Faculty and Admins see full details including HTE IDs and internal statuses.",
      icon: Shield,
      color: "text-purple-600 bg-purple-50"
    },
    {
      title: "Ready to Start?",
      content: "Use the Dashboard for a quick overview, or head to MOA Records to search and manage agreements. Admins can initialize mock data from the Dashboard.",
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50"
    }
  ];

  const nextStep = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BookOpen className="text-emerald-600" size={20} />
            <h2 className="font-bold text-slate-800">User Guide</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${steps[step].color}`}>
                {React.createElement(steps[step].icon, { size: 32 })}
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">{steps[step].title}</h3>
                <p className="text-slate-600 leading-relaxed">{steps[step].content}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200'}`} 
                />
              ))}
            </div>
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={prevStep}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Got it!
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserGuide;
