import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import TermsAndPolicyModal from '../components/TermsAndPolicyModal';

const Login: React.FC = () => {
  const { login, user, loading, loginError } = useAuth();
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (user) window.location.href = '/';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 bg-emerald-900"
        style={{ backgroundImage: 'url("/neu.jpg")' }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 border-4 border-emerald-500/30 overflow-hidden">
            <img src="/logo.jpg" alt="NEU Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">MOANEUVA</h1>
          <p className="text-zinc-400 text-sm">Maneuvering Institutional Partnerships</p>
        </div>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center"
          >
            {loginError}
          </motion.div>
        )}

        <div className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
          />
          <label htmlFor="terms" className="text-xs text-zinc-400 leading-relaxed">
            I have read and agree to the <button type="button" onClick={() => setIsModalOpen(true)} className="text-emerald-400 hover:underline">Terms of Service</button> and <button type="button" onClick={() => setIsModalOpen(true)} className="text-emerald-400 hover:underline">Data Privacy Policy</button>.
          </label>
        </div>

        <button
          onClick={login}
          disabled={!termsAccepted}
          className="w-full bg-white text-black font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-xs text-zinc-500 leading-relaxed">
          Institutional access only.
        </p>
      </motion.div>

      <TermsAndPolicyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Login;
