import { useState, useMemo } from 'react';
import { parseSalesCsv, SAMPLE_SALES_CSV } from './utils/csvParser';
import { calculateSalesAnalysis } from './utils/salesCalculator';
import { UploadSection } from './components/UploadSection';
import { KpiMetrics } from './components/KpiMetrics';
import { ChartSection } from './components/ChartSection';
import { TableSection } from './components/TableSection';
import { AiSummaryCard } from './components/AiSummaryCard';
import { BarChart2, Sparkles } from 'lucide-react';

export default function App() {
  // Pre-load realistic enterprise demo data so the dashboard is immediately rich and interactive
  const [csvText, setCsvText] = useState<string>(SAMPLE_SALES_CSV);
  const [fileName, setFileName] = useState<string>('Enterprise_Sales_Orders_Q1_Q4_Demo.csv');
  const [selectedMetric, setSelectedMetric] = useState<'dollar' | 'percent'>('dollar');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [autoCleanEnabled, setAutoCleanEnabled] = useState<boolean>(true);

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
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Quarterly Regional Sales Analytics
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  AI Powered
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Analyze quarterly revenue by region and synthesize Q2 → Q3 performance with Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden md:inline">Current dataset:</span>
            <span className="font-mono text-slate-700 font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs truncate max-w-[200px]">
              {fileName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Upload & CSV Management Section with Smart Data Cleaning Controls */}
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
            {/* KPI Executive Metric Cards */}
            <KpiMetrics analysis={analysis} selectedMetric={selectedMetric} />

            {/* AI 3-Sentence Executive Summary Card */}
            <AiSummaryCard
              analysis={analysis}
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />

            {/* Total Revenue by Region and Quarter Chart */}
            <ChartSection analysis={analysis} />

            {/* Total Revenue by Region and Quarter Table */}
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
