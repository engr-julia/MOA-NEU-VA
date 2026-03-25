import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface FilePreviewProps {
  url: string;
  fileName?: string;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ url, fileName = 'Document', className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const getFileType = (url: string) => {
    const cleanUrl = url.split('?')[0].toLowerCase();
    const extension = cleanUrl.split('.').pop();
    
    if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(extension || '')) {
      return 'image';
    }
    
    if (extension === 'pdf') {
      return 'pdf';
    }
    
    return 'other';
  };

  const fileType = getFileType(url);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  const getPdfUrl = (url: string) => {
    if (useFallback) return googleDocsViewerUrl;
    return `${url}#toolbar=0`;
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText size={18} className="text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-bold text-slate-700 truncate" title={fileName}>
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            title="Download File"
          >
            <Download size={18} />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            title="Open in New Tab"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative bg-slate-100 flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 z-10">
            <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
            <p className="text-xs text-slate-400 font-medium">Loading preview...</p>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium mb-4">Preview not available for this file type</p>
            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              Download to View
            </button>
          </div>
        ) : fileType === 'image' ? (
          <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          </div>
        ) : fileType === 'pdf' ? (
          <div className="w-full h-full">
            <iframe
              src={getPdfUrl(url)}
              className="w-full h-full border-none"
              title={fileName}
              onLoad={() => setLoading(false)}
              onError={() => {
                if (!useFallback) {
                  setUseFallback(true);
                } else {
                  setLoading(false);
                  setError(true);
                }
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium mb-4">No preview available for this file</p>
            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              Download File
            </button>
          </div>
        )}
      </div>

      {/* Footer / Action */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex justify-center">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Download size={14} />
          DOWNLOAD FILE
        </button>
      </div>
    </div>
  );
};

export default FilePreview;
