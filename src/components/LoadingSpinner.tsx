import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-emerald-600">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
