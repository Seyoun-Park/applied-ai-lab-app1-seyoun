import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Eye,
  X,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
} from 'lucide-react';
import { SalesRecord, TextCleaningAudit } from '../types/sales';
import { SAMPLE_SALES_CSV } from '../utils/csvParser';

interface UploadSectionProps {
  onDataLoaded: (csvText: string, fileName: string) => void;
  currentRecords: SalesRecord[];
  currentFileName: string;
  errorMessages: string[];
  cleaningAudits: TextCleaningAudit[];
  totalCleanedModifications: number;
  autoCleanEnabled: boolean;
  onToggleAutoClean: (enabled: boolean) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onDataLoaded,
  currentRecords,
  currentFileName,
  errorMessages,
  cleaningAudits,
  totalCleanedModifications,
  autoCleanEnabled,
  onToggleAutoClean,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showRawModal, setShowRawModal] = useState(false);
  const [showCleaningModal, setShowCleaningModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      alert('Please upload a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onDataLoaded(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    onDataLoaded(SAMPLE_SALES_CSV, 'Enterprise_Sales_Orders_Q1_Q4_Demo.csv');
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_SALES_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sales_orders_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = React.useMemo(() => {
    if (!searchTerm) return currentRecords.slice(0, 60);
    const lower = searchTerm.toLowerCase();
    return currentRecords
      .filter(
        (r) =>
          r.region.toLowerCase().includes(lower) ||
          r.quarter.toLowerCase().includes(lower) ||
          r.product.toLowerCase().includes(lower) ||
          r.channel.toLowerCase().includes(lower) ||
          (r.rawRegion && r.rawRegion.toLowerCase().includes(lower))
      )
      .slice(0, 60);
  }, [currentRecords, searchTerm]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Upload Sales Orders CSV
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Required columns:{' '}
            <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
              quarter, region, channel, product, units, discount_pct, revenue
            </span>
          </p>
        </div>

        {/* Quick Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Load Demo Dataset</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,text/csv"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200 text-blue-600">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Click to browse or drag and drop your sales orders CSV
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports standard comma-separated files up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Errors display */}
      {errorMessages.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>CSV Parsing Warning / Errors:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {errorMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Cleaning Intelligence Banner */}
      {currentRecords.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/70 border border-blue-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">Smart Text Normalization</span>
                {totalCleanedModifications > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Cleaned {totalCleanedModifications} inconsistencies
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                    All text clean & consistent
                  </span>
                )}
              </div>
              <p className="text-slate-600 mt-0.5">
                Automatically consolidates human casing errors (e.g.{' '}
                <span className="font-semibold text-slate-800">"west"</span> &{' '}
                <span className="font-semibold text-slate-800">"West"</span> →{' '}
                <span className="font-semibold text-blue-700">"West"</span>), trims excess spaces,
                and harmonizes acronyms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {totalCleanedModifications > 0 && (
              <button
                onClick={() => setShowCleaningModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 font-semibold border border-blue-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                View Corrections ({cleaningAudits.length})
              </button>
            )}

            {/* Toggle cleaning */}
            <button
              onClick={() => onToggleAutoClean(!autoCleanEnabled)}
              className={`px-3 py-1.5 rounded-lg font-medium border text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                autoCleanEnabled
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title="Toggle automatic text cleaning"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Auto-Clean: {autoCleanEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* File status pill if loaded */}
      {currentRecords.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{currentFileName || 'Custom CSV'}</span>
            <span className="text-emerald-700">
              — Successfully parsed {currentRecords.length.toLocaleString()} valid sales order rows
            </span>
          </div>

          <button
            onClick={() => setShowRawModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-800 rounded font-medium transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Records Table</span>
          </button>
        </div>
      )}

      {/* Cleaning Audit Modal */}
      {showCleaningModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    Text Cleaning & Harmonization Audit
                  </h3>
                  <p className="text-xs text-slate-500">
                    The following inconsistent text entries were unified into standardized values
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCleaningModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto flex-1 p-4">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-2.5">Column</th>
                    <th className="p-2.5">Original Raw Text</th>
                    <th className="p-2.5">Cleaned / Unified Value</th>
                    <th className="p-2.5 text-right">Rows Affected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cleaningAudits.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-slate-800 capitalize">
                        {item.column}
                      </td>
                      <td className="p-2.5 font-mono text-rose-700 bg-rose-50/50 rounded">
                        "{item.original}"
                      </td>
                      <td className="p-2.5 font-mono font-semibold text-emerald-800 bg-emerald-50/50 rounded">
                        "{item.cleaned}"
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-slate-700">
                        {item.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total modifications applied: {totalCleanedModifications}
              </span>
              <button
                onClick={() => setShowCleaningModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Records Modal */}
      {showRawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  Sales Order Records ({currentRecords.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Showing first 60 matched rows from {currentFileName} (Normalized)
                </p>
              </div>
              <button
                onClick={() => setShowRawModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by region, quarter, product, channel, or original raw string..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-hidden"
              />
            </div>

            <div className="overflow-auto flex-1 p-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-2">Quarter</th>
                    <th className="p-2">Region</th>
                    <th className="p-2">Channel</th>
                    <th className="p-2">Product</th>
                    <th className="p-2 text-right">Units</th>
                    <th className="p-2 text-right">Discount</th>
                    <th className="p-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => {
                    const wasRegionModified = r.rawRegion && r.rawRegion !== r.region;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-800">{r.quarter}</td>
                        <td className="p-2 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span>{r.region}</span>
                            {wasRegionModified && (
                              <span
                                className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono"
                                title={`Original CSV value was: "${r.rawRegion}"`}
                              >
                                raw: "{r.rawRegion}"
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-slate-600">{r.channel}</td>
                        <td className="p-2 text-slate-600">{r.product}</td>
                        <td className="p-2 text-right font-mono">{r.units.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono">{r.discount_pct.toFixed(1)}%</td>
                        <td className="p-2 text-right font-mono font-medium text-slate-900">
                          ${r.revenue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-right">
              <button
                onClick={() => setShowRawModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
