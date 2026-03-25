import React, { useState, useEffect } from 'react';
import { MOARecord, useMOAs } from '../hooks/useMOAs';
import FilePreview from '../components/FilePreview';
import { X, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { uploadFileToCloudinary } from '../utils/cloudinary';

interface MOAFormProps {
  onClose: () => void;
  initialData?: MOARecord;
  quickFile?: File;
}

const MOAForm: React.FC<MOAFormProps> = ({ onClose, initialData, quickFile }) => {
  const { addMOA, updateMOA } = useMOAs();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSplitView, setIsSplitView] = useState(!!initialData?.documentUrl || !!quickFile);
  const [fileMetadata, setFileMetadata] = useState<{ name: string; url: string } | null>(
    initialData?.documentUrl ? { name: 'Current Document', url: initialData.documentUrl } : null
  );
  const [formData, setFormData] = useState({
    hteId: initialData?.hteId || '',
    companyName: initialData?.companyName || '',
    address: initialData?.address || '',
    contactPerson: initialData?.contactPerson || '',
    contactEmail: initialData?.contactEmail || '',
    industryType: initialData?.industryType || 'Technology',
    status: initialData?.status || 'PROCESSING: MOA draft sent to Legal Office for review',
    college: initialData?.college || 'CEIT',
    effectiveDate: initialData?.effectiveDate ? initialData.effectiveDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    documentUrl: initialData?.documentUrl || '',
  });

  useEffect(() => {
    if (quickFile) {
      // Client-side validation for quick upload
      const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
      const isAllowedType = allowedTypes.includes(quickFile.type) || 
                           /\.(jpg|jpeg|pdf)$/i.test(quickFile.name);
      
      if (!isAllowedType) {
        setUploadError("Invalid file type. Only JPG and PDF files are accepted.");
        setIsSplitView(false);
        return;
      }

      if (quickFile.size > 10 * 1024 * 1024) {
        setUploadError("File is too large. Maximum size is 10MB.");
        setIsSplitView(false);
        return;
      }

      uploadFile(quickFile);
      setIsSplitView(true);
    }
  }, [quickFile]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      // 1. Upload to Cloudinary
      const url = await uploadFileToCloudinary(file);
      
      setFileMetadata({ name: file.name, url });
      setFormData(prev => ({ ...prev, documentUrl: url }));
      setIsSplitView(true);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload document. Please check your Cloudinary configuration.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
    const isAllowedType = allowedTypes.includes(file.type) || 
                         /\.(jpg|jpeg|pdf)$/i.test(file.name);
    
    if (!isAllowedType) {
      setUploadError("Invalid file type. Only JPG and PDF files are accepted.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 10MB.");
      return;
    }

    uploadFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      status: formData.status as MOARecord['status'],
      effectiveDate: Timestamp.fromDate(new Date(formData.effectiveDate)),
    };

    let moaId = initialData?.id;

    if (initialData) {
      await updateMOA(initialData.id, payload);
    } else {
      const docRef = await addMOA(payload as any);
      if (docRef) {
        moaId = docRef.id;
      }
    }

    // Save file metadata to 'moaFiles' collection if a new file was uploaded
    if (moaId && fileMetadata && (!initialData || fileMetadata.url !== initialData.documentUrl)) {
      try {
        await addDoc(collection(db, 'moaFiles'), {
          fileName: fileMetadata.name,
          fileURL: fileMetadata.url,
          uploadedBy: auth.currentUser?.email,
          uploadedAt: Timestamp.now(),
          relatedMOA: moaId
        });
      } catch (err) {
        console.error("Error saving file metadata:", err);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${isSplitView ? 'max-w-[95vw] h-[90vh]' : 'max-w-2xl max-h-[90vh]'}`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Edit MOA Record' : 'New MOA Entry'}</h2>
            {formData.documentUrl && (
              <button 
                onClick={() => setIsSplitView(!isSplitView)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${isSplitView ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
              >
                {isSplitView ? 'Close Split View' : 'Open Split View'}
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className={`flex flex-1 overflow-hidden ${isSplitView ? 'flex-row' : 'flex-col'}`}>
          {/* Document Preview (Left Side in Split View) */}
          {isSplitView && formData.documentUrl && (
            <div className="flex-1 bg-slate-100 border-r border-slate-200 overflow-hidden flex flex-col">
              <FilePreview 
                url={formData.documentUrl} 
                fileName={fileMetadata?.name || 'MOA Document'} 
              />
            </div>
          )}

          {/* Form (Right Side in Split View) */}
          <form onSubmit={handleSubmit} className={`flex-1 overflow-y-auto p-8 space-y-6 ${isSplitView ? 'max-w-xl' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">HTE ID</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.hteId}
                onChange={(e) => setFormData({ ...formData, hteId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Person</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
              <input
                required
                type="email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Industry Type</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.industryType}
                onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
              >
                <option>Technology</option>
                <option>Telecom</option>
                <option>Food</option>
                <option>Services</option>
                <option>Finance</option>
                <option>Manufacturing</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endorsed by College</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              >
                <option>CAS</option>
                <option>CBA</option>
                <option>CCJE</option>
                <option>CED</option>
                <option>CEIT</option>
                <option>CHM</option>
                <option>CON</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Effective Date</label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <optgroup label="APPROVED">
                  <option value="APPROVED: Signed by President">APPROVED: Signed by President</option>
                  <option value="APPROVED: Ongoing Notarization">APPROVED: Ongoing Notarization</option>
                  <option value="APPROVED: No Notarization Needed">APPROVED: No Notarization Needed</option>
                </optgroup>
                <optgroup label="PROCESSING">
                  <option value="PROCESSING: Awaiting signature of the MOA draft by HTE partner">PROCESSING: Awaiting signature of the MOA draft by HTE partner</option>
                  <option value="PROCESSING: MOA draft sent to Legal Office for review">PROCESSING: MOA draft sent to Legal Office for review</option>
                  <option value="PROCESSING: MOA draft and legal opinion sent to VPAA/OP for approval">PROCESSING: MOA draft and legal opinion sent to VPAA/OP for approval</option>
                </optgroup>
                <optgroup label="EXPIRATION">
                  <option value="EXPIRED: No renewal done">EXPIRED: No renewal done</option>
                  <option value="EXPIRING: Two months before expiration date">EXPIRING: Two months before expiration date</option>
                </optgroup>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">MOA Document (JPG or PDF)</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept="image/jpeg,application/pdf" />
                    {uploading ? (
                      <Loader2 className="animate-spin text-emerald-500" size={24} />
                    ) : (
                      <Upload className="text-slate-400 group-hover:text-emerald-500" size={24} />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-700">
                        {formData.documentUrl ? 'Change Document' : 'Upload Document'}
                      </p>
                      <p className="text-xs text-slate-400">JPG or PDF up to 10MB</p>
                    </div>
                  </label>
                  {formData.documentUrl && (
                    <a 
                      href={formData.documentUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all"
                      title="View Current Document"
                    >
                      <FileText size={24} />
                    </a>
                  )}
                </div>
                {uploadError && (
                  <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                    <AlertCircle size={14} />
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              {initialData ? 'Update Record' : 'Save Entry'}
            </button>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
};

export default MOAForm;
