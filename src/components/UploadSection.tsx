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
    <div className="bg-[#0e0e0e] border border-[#262626] p-4 space-y-3.5">
      {/* Terminal Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#222222] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#ff8c00] font-bold text-sm tracking-wider">
              [01 // CSV DATA INGESTION &amp; NORMALIZATION ENGINE]
            </span>
          </div>
          <p className="text-[11px] text-[#777777] mt-1 font-mono">
            SCHEMA: <span className="text-[#00ff66]">quarter, region, channel, product, units, discount_pct, revenue</span>
          </p>
        </div>

        {/* Quick Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ff8c00] hover:bg-[#ffa000] text-black font-extrabold text-xs tracking-wider transition-colors cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>LOAD DEMO &lt;GO&gt;</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] hover:bg-[#222222] text-[#cccccc] hover:text-white border border-[#333333] hover:border-[#ff8c00] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#ff8c00]" />
            <span>EXPORT TEMPLATE</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#ff8c00] bg-[#1a1100]'
            : 'border-[#2e2e2e] hover:border-[#ff8c00] bg-[#080808] hover:bg-[#0c0c0c]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,text/csv"
          className="hidden"
        />

        <div className="flex items-center justify-center gap-3">
          <Upload className="w-4 h-4 text-[#ff8c00]" />
          <div className="text-xs">
            <span className="text-[#ffffff] font-semibold">
              CLICK TO BROWSE OR DRAG &amp; DROP CSV FILE
            </span>
            <span className="text-[#666666] ml-2 text-[11px]">
              [ASCII / UTF-8 CSV &le; 10MB]
            </span>
          </div>
        </div>
      </div>

      {/* Errors display */}
      {errorMessages.length > 0 && (
        <div className="p-3 bg-[#1e0a0a] border border-[#ff3b30]/60 text-xs text-[#ff6b6b] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#ff3b30]">
            <AlertCircle className="w-4 h-4 text-[#ff3b30]" />
            <span>[WARNING] PARSER ANOMALIES DETECTED:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-[#ffaaaa]">
            {errorMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Cleaning Intelligence Banner */}
      {currentRecords.length > 0 && (
        <div className="bg-[#121212] border border-[#2a2a2a] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="text-[#00e5ff] font-bold text-[11px] flex items-center gap-1.5">
              <span>[TEXT NORMALIZATION]</span>
            </div>
            <div className="text-xs text-[#aaaaaa]">
              {totalCleanedModifications > 0 ? (
                <span className="text-[#00ff66] font-semibold">
                  STATUS: HARMONIZED {totalCleanedModifications} ENTRIES (Casing, Aliases, Whitespace)
                </span>
              ) : (
                <span className="text-[#888888]">
                  STATUS: ZERO SYNTAX INCONSISTENCIES
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalCleanedModifications > 0 && (
              <button
                onClick={() => setShowCleaningModal(true)}
                className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] text-[#00e5ff] font-bold border border-[#00e5ff]/40 text-[11px] transition-colors cursor-pointer"
              >
                VIEW AUDIT LOG ({cleaningAudits.length})
              </button>
            )}

            {/* Toggle cleaning */}
            <button
              onClick={() => onToggleAutoClean(!autoCleanEnabled)}
              className={`px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
                autoCleanEnabled
                  ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/50'
                  : 'bg-[#181818] text-[#888888] border-[#333333]'
              }`}
              title="Toggle automatic text cleaning"
            >
              AUTO-CLEAN: {autoCleanEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      )}

      {/* File status banner if loaded */}
      {currentRecords.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#0a120a] border border-[#00ff66]/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff66] font-bold">[ACTIVE DATASET]</span>
            <span className="text-white font-semibold">{currentFileName || 'Custom CSV'}</span>
            <span className="text-[#888888] text-[11px]">
              &middot; {currentRecords.length.toLocaleString()} ROWS INGESTED
            </span>
          </div>

          <button
            onClick={() => setShowRawModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#161616] hover:bg-[#222222] border border-[#333333] hover:border-[#00ff66] text-[#00ff66] text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>RAW DATA LEDGER</span>
          </button>
        </div>
      )}

      {/* Cleaning Audit Modal */}
      {showCleaningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border-2 border-[#00e5ff] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden font-mono text-xs">
            <div className="p-3 border-b border-[#222222] flex items-center justify-between bg-[#141414]">
              <div>
                <h3 className="font-bold text-[#00e5ff] text-sm uppercase">
                  [AUDIT LOG // TEXT NORMALIZATION MATRIX]
                </h3>
                <p className="text-[10px] text-[#777777]">
                  Raw string reconciliations mapped to standardized dimensions
                </p>
              </div>
              <button
                onClick={() => setShowCleaningModal(false)}
                className="p-1 hover:bg-[#222222] text-[#888888] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto flex-1 p-3">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#181818] text-[#ff8c00] font-bold uppercase text-[10px] border-b border-[#2a2a2a]">
                    <th className="p-2">DIMENSION</th>
                    <th className="p-2">RAW STRING</th>
                    <th className="p-2">UNIFIED VALUE</th>
                    <th className="p-2 text-right">ROW COUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {cleaningAudits.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#161616]">
                      <td className="p-2 font-bold text-[#cccccc] uppercase">
                        {item.column}
                      </td>
                      <td className="p-2 font-mono text-[#ff4444]">
                        "{item.original}"
                      </td>
                      <td className="p-2 font-mono font-bold text-[#00ff66]">
                        "{item.cleaned}"
                      </td>
                      <td className="p-2 text-right font-mono text-[#ffffff] tabular-nums">
                        {item.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-[#222222] bg-[#141414] flex items-center justify-between text-[11px]">
              <span className="text-[#888888]">
                TOTAL MODIFICATIONS: <span className="text-[#00ff66] font-bold">{totalCleanedModifications}</span>
              </span>
              <button
                onClick={() => setShowCleaningModal(false)}
                className="px-3 py-1 bg-[#ff8c00] hover:bg-[#ffa000] text-black font-extrabold uppercase text-xs cursor-pointer"
              >
                CLOSE &lt;ESC&gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Records Modal */}
      {showRawModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border-2 border-[#ff8c00] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden font-mono text-xs">
            <div className="p-3 border-b border-[#222222] flex items-center justify-between bg-[#141414]">
              <div>
                <h3 className="font-bold text-[#ff8c00] text-sm uppercase">
                  [RAW RECORD VIEWER // {currentFileName}]
                </h3>
                <p className="text-[10px] text-[#777777]">
                  Showing first 60 rows normalized from ingested stream
                </p>
              </div>
              <button
                onClick={() => setShowRawModal(false)}
                className="p-1 hover:bg-[#222222] text-[#888888] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 border-b border-[#1f1f1f] bg-[#0a0a0a] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#ff8c00]" />
              <input
                type="text"
                placeholder="FILTER BY REGION, PRODUCT, CHANNEL, QUARTER..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-white w-full focus:outline-hidden placeholder:text-[#555555]"
              />
            </div>

            <div className="overflow-auto flex-1 p-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#181818] text-[#ff8c00] font-bold uppercase text-[10px] border-b border-[#2a2a2a]">
                    <th className="p-2">QUARTER</th>
                    <th className="p-2">REGION</th>
                    <th className="p-2">CHANNEL</th>
                    <th className="p-2">PRODUCT</th>
                    <th className="p-2 text-right">UNITS</th>
                    <th className="p-2 text-right">DISCOUNT</th>
                    <th className="p-2 text-right">REVENUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181818]">
                  {filteredRecords.map((r) => {
                    const wasRegionModified = r.rawRegion && r.rawRegion !== r.region;
                    return (
                      <tr key={r.id} className="hover:bg-[#141414]">
                        <td className="p-2 text-[#ffcc00] font-bold">{r.quarter}</td>
                        <td className="p-2 text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{r.region}</span>
                            {wasRegionModified && (
                              <span
                                className="text-[10px] bg-[#221500] text-[#ff8c00] px-1 py-0.2 border border-[#ff8c00]/40 font-mono"
                                title={`Original CSV value was: "${r.rawRegion}"`}
                              >
                                raw: "{r.rawRegion}"
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-[#aaaaaa]">{r.channel}</td>
                        <td className="p-2 text-[#cccccc]">{r.product}</td>
                        <td className="p-2 text-right font-mono tabular-nums text-white">{r.units.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono tabular-nums text-[#ffcc00]">{r.discount_pct.toFixed(1)}%</td>
                        <td className="p-2 text-right font-mono tabular-nums font-bold text-[#00ff66]">
                          ${r.revenue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-[#222222] bg-[#141414] text-right">
              <button
                onClick={() => setShowRawModal(false)}
                className="px-3.5 py-1 bg-[#ff8c00] hover:bg-[#ffa000] text-black font-extrabold uppercase text-xs cursor-pointer"
              >
                DISMISS &lt;ESC&gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
