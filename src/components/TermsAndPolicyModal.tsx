import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndPolicyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Terms & Policy</h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">Terms of Service</h3>
                <p>Welcome to MOANEUVA. By accessing this platform, you agree to use it solely for authorized institutional purposes related to Memorandum of Agreement (MOA) tracking and management. Unauthorized access, data scraping, or misuse of this system is strictly prohibited.</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">Data Privacy Policy</h3>
                <p>Your privacy is important to us. MOANEUVA collects and processes data necessary for institutional partnership management. We ensure that your data is handled securely, in compliance with the Data Privacy Act of 2012. We do not share your personal information with unauthorized third parties.</p>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default TermsAndPolicyModal;
