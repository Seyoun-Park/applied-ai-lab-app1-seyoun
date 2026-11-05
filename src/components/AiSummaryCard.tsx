import React, { useState, useEffect } from 'react';
import { SalesAnalysisResult, AiSummaryResponse } from '../types/sales';
import {
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface AiSummaryCardProps {
  analysis: SalesAnalysisResult;
  selectedMetric: 'dollar' | 'percent';
  onMetricChange: (metric: 'dollar' | 'percent') => void;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  analysis,
  selectedMetric,
  onMetricChange,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<AiSummaryResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);

  // Active region based on metric choice
  const targetRegionAnalysis =
    selectedMetric === 'dollar' ? analysis.largestByDollar : analysis.largestByPct;

  const generateSummary = async () => {
    if (!analysis.hasQ2AndQ3 || !targetRegionAnalysis) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        largestRegion: targetRegionAnalysis.region,
        rankMetric: selectedMetric,
        q2Revenue: targetRegionAnalysis.q2Revenue,
        q3Revenue: targetRegionAnalysis.q3Revenue,
        dollarDelta: targetRegionAnalysis.dollarDelta,
        pctDelta: targetRegionAnalysis.pctDelta,
        allRegionsRanked: analysis.q2q3AnalysisList.map((r) => ({
          region: r.region,
          q2Revenue: r.q2Revenue,
          q3Revenue: r.q3Revenue,
          dollarDelta: r.dollarDelta,
          pctDelta: r.pctDelta,
        })),
        topProductDrivers: targetRegionAnalysis.topProductDrivers,
        topChannelDrivers: targetRegionAnalysis.topChannelDrivers,
        units: {
          q2Units: targetRegionAnalysis.q2Units,
          q3Units: targetRegionAnalysis.q3Units,
          deltaUnits: targetRegionAnalysis.deltaUnits,
          pctChange: targetRegionAnalysis.unitsPctChange,
        },
        discount: {
          q2AvgDiscountPct: targetRegionAnalysis.q2AvgDiscountPct,
          q3AvgDiscountPct: targetRegionAnalysis.q3AvgDiscountPct,
          deltaDiscountPctPoint: targetRegionAnalysis.deltaDiscountPctPoint,
        },
        totalRevenueQ2AllRegions: analysis.quarterTotals['Q2'] || 0,
        totalRevenueQ3AllRegions: analysis.quarterTotals['Q3'] || 0,
      };

      const response = await fetch('/api/summarize-q2-q3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      const data: AiSummaryResponse = await response.json();
      setSummaryData(data);
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate AI executive summary');
    } finally {
      setLoading(false);
    }
  };

  // Automatically trigger when analysis or metric changes
  useEffect(() => {
    if (analysis.hasQ2AndQ3 && targetRegionAnalysis) {
      generateSummary();
    } else {
      setSummaryData(null);
    }
  }, [analysis.hasQ2AndQ3, targetRegionAnalysis?.region, selectedMetric]);

  const handleCopy = () => {
    if (!summaryData?.summary) return;
    navigator.clipboard.writeText(summaryData.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to split text into sentences
  const sentences = React.useMemo(() => {
    if (!summaryData?.summary) return [];
    const raw = summaryData.summary.match(/[^.!?]+[.!?]+/g) || [summaryData.summary];
    return raw.map((s) => s.trim());
  }, [summaryData]);

  if (!analysis.hasQ2AndQ3) {
    return (
      <div className="bg-[#181100] border border-[#ff8c00]/50 p-4 text-[#ffcc00] flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#ff8c00] shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-[#ff8c00] uppercase">[PREREQUISITE NOTICE: Q2 &amp; Q3 REQUIRED]</span>
          <p className="text-[#ddaa00] mt-1">
            Current dataset contains quarters [{analysis.quarters.join(', ')}]. Synthesizer requires both{' '}
            <span className="font-bold text-white">Q2</span> and <span className="font-bold text-white">Q3</span> to compute regional delta and drivers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0e0e] border border-[#ff8c00] text-[#e0e0e0] overflow-hidden">
      {/* Bloomberg Intelligence Banner Header */}
      <div className="bg-[#141414] px-4 py-2.5 border-b border-[#282828] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#ff8c00] text-black px-1.5 py-0.5 text-[11px] font-extrabold tracking-wider">
            BI &lt;GO&gt;
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white tracking-wide uppercase">
                [03 // BLOOMBERG INTELLIGENCE: Q2 → Q3 SALES SYNTHESIS]
              </h3>
              <span className="hidden sm:inline text-[#00ff66] text-[10px] border border-[#00ff66]/40 px-1.5 py-0.2 bg-[#00ff66]/10 font-bold">
                GROUND-TRUTH ARITHMETIC VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-[#888888]">
              Three-sentence brief analyzing top regional mover and underlying drivers using app-calculated figures
            </p>
          </div>
        </div>

        {/* Action and Metric Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          {/* Rank metric toggle */}
          <div className="flex items-center bg-[#090909] border border-[#333333] p-0.5">
            <button
              onClick={() => onMetricChange('dollar')}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'dollar'
                  ? 'bg-[#ff8c00] text-black'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Rank by highest absolute dollar change"
            >
              $ DELTA &lt;F7&gt;
            </button>
            <button
              onClick={() => onMetricChange('percent')}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === 'percent'
                  ? 'bg-[#ff8c00] text-black'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Rank by highest percentage change"
            >
              % DELTA &lt;F8&gt;
            </button>
          </div>

          <button
            onClick={generateSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1a1a1a] hover:bg-[#252525] border border-[#444444] hover:border-[#ff8c00] text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Regenerate Summary"
          >
            <RefreshCw className={`w-3 h-3 text-[#ff8c00] ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'CALCULATING...' : 'RERUN &lt;GO&gt;'}</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!summaryData}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] border border-[#444444] hover:border-[#00e5ff] text-xs font-bold text-[#00e5ff] transition-all disabled:opacity-50 cursor-pointer"
            title="Copy 3-Sentence Summary"
          >
            {copied ? <Check className="w-3 h-3 text-[#00ff66]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 bg-[#0a0a0a]">
        {loading && (
          <div className="py-5 space-y-2">
            <div className="flex items-center gap-2 text-[#ff8c00] text-xs">
              <span className="animate-pulse">SYNTHESIZING APP-CALCULATED REGIONAL DRIVERS INTO STRICTLY 3 SENTENCES...</span>
            </div>
            <div className="h-3 bg-[#181818] w-full animate-pulse border border-[#222222]" />
            <div className="h-3 bg-[#181818] w-11/12 animate-pulse border border-[#222222]" />
            <div className="h-3 bg-[#181818] w-4/5 animate-pulse border border-[#222222]" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#240a0a] border border-[#ff3b30] text-xs text-[#ff8888] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#ff3b30] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#ff3b30]">[ERROR] UNABLE TO GENERATE SUMMARY:</span>
              <p>{error}</p>
              <button
                onClick={generateSummary}
                className="mt-1 text-[#ff8c00] underline font-bold cursor-pointer"
              >
                RETRY COMMAND
              </button>
            </div>
          </div>
        )}

        {!loading && !error && summaryData && (
          <div className="space-y-4">
            {/* The 3-Sentence Executive Text */}
            <div className="space-y-2">
              {sentences.length === 3 ? (
                <div className="grid grid-cols-1 gap-2">
                  {sentences.map((sentence, idx) => {
                    const headers = [
                      '[01 // VARIANCE LEAD]',
                      '[02 // DRIVER DECOMPOSITION]',
                      '[03 // VOLUME & DISCOUNTING CONTEXT]',
                    ];
                    const headerColors = [
                      'text-[#ff8c00]',
                      'text-[#00e5ff]',
                      'text-[#ffd700]',
                    ];
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#111111] border-l-2 border-l-[#ff8c00] border-y border-r border-[#1f1f1f] hover:border-[#ff8c00]/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-extrabold tracking-wider ${headerColors[idx] || 'text-[#ff8c00]'}`}>
                            {headers[idx] || `[0${idx + 1} // STATEMENT]`}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-[#f0f0f0] font-mono">
                          {sentence}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-[#111111] border border-[#222222]">
                  <p className="text-xs sm:text-sm leading-relaxed text-[#f0f0f0] font-mono">
                    {summaryData.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Monospace Verified Metrics Bar */}
            {summaryData.verifiedNumbers && (
              <div className="pt-2.5 border-t border-[#1e1e1e] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[#ff8c00] font-bold">[VERIFIED METRICS]:</span>
                  <span className="px-1.5 py-0.5 bg-[#141414] border border-[#2a2a2a] text-white">
                    REGION: <span className="text-[#00e5ff] font-bold">{summaryData.verifiedNumbers.region}</span>
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#141414] border border-[#2a2a2a] text-[#aaaaaa]">
                    Q2: <span className="text-white font-bold">${summaryData.verifiedNumbers.q2Revenue.toLocaleString()}</span>
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#141414] border border-[#2a2a2a] text-[#aaaaaa]">
                    Q3: <span className="text-white font-bold">${summaryData.verifiedNumbers.q3Revenue.toLocaleString()}</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 border font-bold tabular-nums ${
                      summaryData.verifiedNumbers.dollarDelta >= 0
                        ? 'bg-[#002200] text-[#00ff66] border-[#00ff66]/40'
                        : 'bg-[#220000] text-[#ff3b30] border-[#ff3b30]/40'
                    }`}
                  >
                    SHIFT: {summaryData.verifiedNumbers.dollarDelta >= 0 ? '+' : ''}$
                    {summaryData.verifiedNumbers.dollarDelta.toLocaleString()} (
                    {summaryData.verifiedNumbers.pctDelta >= 0 ? '+' : ''}
                    {summaryData.verifiedNumbers.pctDelta.toFixed(1)}%)
                  </span>
                </div>

                {/* Audit Drawer Toggle */}
                <button
                  onClick={() => setShowAuditDrawer(!showAuditDrawer)}
                  className="inline-flex items-center gap-1 text-[11px] text-[#ff8c00] hover:text-[#ffa500] font-bold transition-colors cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>{showAuditDrawer ? 'HIDE GROUND TRUTH &lt;F9&gt;' : 'SHOW GROUND TRUTH &lt;F9&gt;'}</span>
                  {showAuditDrawer ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            {/* Collapsible Audit Drawer showing the prompt context fed to Gemini */}
            {showAuditDrawer && summaryData.calculatedContext && (
              <div className="mt-2 p-3 bg-[#050505] border border-[#333333] text-xs space-y-1.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]">
                  <span className="font-bold text-[#ff8c00] text-[11px]">
                    [PROMPT PAYLOAD // EXACT ARITHMETIC CONTEXT ENFORCED]
                  </span>
                  <span className="text-[10px] text-[#666666]">
                    MODEL: {summaryData.modelUsed || 'GEMINI'}
                  </span>
                </div>
                <pre className="font-mono text-[10px] text-[#00ff66] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 p-2 bg-[#0c0c0c] border border-[#1a1a1a]">
                  {summaryData.calculatedContext}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
