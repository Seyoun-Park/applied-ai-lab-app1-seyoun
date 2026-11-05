import { useState, useMemo, useEffect } from 'react';
import { parseSalesCsv, SAMPLE_SALES_CSV } from './utils/csvParser';
import { calculateSalesAnalysis } from './utils/salesCalculator';
import { UploadSection } from './components/UploadSection';
import { KpiMetrics } from './components/KpiMetrics';
import { ChartSection } from './components/ChartSection';
import { TableSection } from './components/TableSection';
import { AiSummaryCard } from './components/AiSummaryCard';
import { Terminal, Activity, FileSpreadsheet, BarChart3, Database } from 'lucide-react';

export default function App() {
  // Pre-load realistic enterprise demo data
  const [csvText, setCsvText] = useState<string>(SAMPLE_SALES_CSV);
  const [fileName, setFileName] = useState<string>('Enterprise_Sales_Orders_Q1_Q4_Demo.csv');
  const [selectedMetric, setSelectedMetric] = useState<'dollar' | 'percent'>('dollar');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [autoCleanEnabled, setAutoCleanEnabled] = useState<boolean>(true);
  const [terminalTime, setTerminalTime] = useState<string>('');

  // Live terminal clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTerminalTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse CSV with auto-clean option
  const parseResult = useMemo(() => {
    return parseSalesCsv(csvText, { enableAutoClean: autoCleanEnabled });
  }, [csvText, autoCleanEnabled]);

  // Calculate full sales analysis
  const analysis = useMemo(() => {
    return calculateSalesAnalysis(parseResult.records);
  }, [parseResult.records]);

  const handleDataLoaded = (newCsvText: string, newFileName: string) => {
    setCsvText(newCsvText);
    setFileName(newFileName);
    setSelectedRegion(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono selection:bg-[#ff8c00] selection:text-black pb-12">
      {/* Bloomberg Terminal Top Navigation & Function Key Header */}
      <header className="bg-[#0c0c0c] border-b-2 border-[#ff8c00] sticky top-0 z-40 shadow-md">
        {/* Top Terminal Status Ticker */}
        <div className="bg-[#121212] border-b border-[#222222] px-3 sm:px-6 py-1 flex items-center justify-between text-[11px] text-[#888888]">
          <div className="flex items-center gap-3">
            <span className="text-[#ff8c00] font-bold tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#ff8c00]" />
              BLOOMBERG TERMINAL
            </span>
            <span className="text-[#333333]">|</span>
            <span className="text-[#00e5ff] font-semibold">QSR &lt;GO&gt;</span>
            <span className="text-[#aaaaaa] hidden md:inline">QUARTERLY REGIONAL SALES MONITOR</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#00ff66] hidden sm:flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#00ff66]" />
              FEED: ACTIVE
            </span>
            <span className="text-[#333333] hidden sm:inline">|</span>
            <span className="text-[#ffcc00] font-mono tabular-nums">{terminalTime || '2026-11-05 15:30:00 UTC'}</span>
          </div>
        </div>

        {/* Command Bar & Active Workspace Info */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#ff8c00] text-black px-2 py-0.5 text-xs font-extrabold tracking-wider">
              COMMAND
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white font-bold tracking-wide">
                ANR &lt;GO&gt; / REGIONAL SALES REVENUE &amp; VARIANCE ANALYSIS
              </span>
              <span className="hidden lg:inline text-[#ff8c00] text-[11px] border border-[#ff8c00]/50 px-1.5 py-0.2 bg-[#ff8c00]/10">
                AI SYNTHESIS ACTIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#777777] uppercase text-[11px]">LOADED DATASET:</span>
            <span className="text-[#00e5ff] bg-[#161616] border border-[#2a2a2a] px-2 py-0.5 text-xs font-semibold truncate max-w-[240px]">
              {fileName}
            </span>
            <span className="text-[#888888] text-[11px] hidden sm:inline">
              [{parseResult.records.length} ROWS]
            </span>
          </div>
        </div>

        {/* Function Keys Ribbon */}
        <div className="bg-[#0a0a0a] border-t border-[#1e1e1e] px-3 sm:px-6 py-1 hidden sm:flex items-center gap-3 text-[10px] text-[#777777] overflow-x-auto">
          <span className="hover:text-[#ff8c00] cursor-pointer"><span className="text-[#ff8c00] font-bold">&lt;F1&gt;</span> HELP</span>
          <span className="hover:text-[#ff8c00] cursor-pointer"><span className="text-[#ff8c00] font-bold">&lt;F2&gt;</span> DATA INGEST</span>
          <span className="hover:text-[#ff8c00] cursor-pointer"><span className="text-[#ff8c00] font-bold">&lt;F3&gt;</span> TELEMETRY</span>
          <span className="hover:text-[#ff8c00] cursor-pointer"><span className="text-[#ff8c00] font-bold">&lt;F4&gt;</span> BI SYNTHESIS</span>
          <span className="hover:text-[#ff8c00] cursor-pointer"><span className="text-[#ff8c00] font-bold">&lt;F5&gt;</span> GRAPH VIEW</span>
          <span className="hover:text-[#ff8c00] cursor-pointer"><span className="text-[#ff8c00] font-bold">&lt;F6&gt;</span> FINANCIAL MATRIX</span>
          <span className="hover:text-[#ff8c00] cursor-pointer"><span className="text-[#ff8c00] font-bold">&lt;F10&gt;</span> EXCEL EXPORT</span>
          <span className="ml-auto text-[#00ff66] font-semibold">TERMINAL SECURITY: ENFORCED</span>
        </div>
      </header>

      {/* Main Terminal Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 space-y-5">
        {/* 01. CSV Ingest & Cleaning Section */}
        <UploadSection
          onDataLoaded={handleDataLoaded}
          currentRecords={parseResult.records}
          currentFileName={fileName}
          errorMessages={parseResult.errors}
          cleaningAudits={parseResult.cleaningAudits}
          totalCleanedModifications={parseResult.totalCleanedModifications}
          autoCleanEnabled={autoCleanEnabled}
          onToggleAutoClean={setAutoCleanEnabled}
        />

        {/* If valid records exist, display the full analytics suite */}
        {parseResult.records.length > 0 && (
          <>
            {/* 02. Executive KPI Metrics */}
            <KpiMetrics analysis={analysis} selectedMetric={selectedMetric} />

            {/* 03. Bloomberg Intelligence AI Summary Card */}
            <AiSummaryCard
              analysis={analysis}
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />

            {/* 04. Regional & Quarterly Revenue Charts */}
            <ChartSection analysis={analysis} />

            {/* 05. Financial Pivot Matrix & Variance Table */}
            <TableSection
              analysis={analysis}
              selectedMoverRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />
          </>
        )}
      </main>
    </div>
  );
}
