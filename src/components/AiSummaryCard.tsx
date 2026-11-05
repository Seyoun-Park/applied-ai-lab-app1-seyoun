import React, { useState, useEffect } from 'react';
import { SalesAnalysisResult, AiSummaryResponse } from '../types/sales';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
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
    // Match sentences ending in ., !, or ?
    const raw = summaryData.summary.match(/[^.!?]+[.!?]+/g) || [summaryData.summary];
    return raw.map((s) => s.trim());
  }, [summaryData]);

  if (!analysis.hasQ2AndQ3) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold text-sm">Q2 and Q3 Data Required for AI Summary</h4>
          <p className="text-xs text-amber-700 mt-1">
            The uploaded CSV dataset contains quarters [{analysis.quarters.join(', ')}], but must contain both{' '}
            <span className="font-semibold">Q2</span> and <span className="font-semibold">Q3</span> for the AI to calculate and summarize the regional shift.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-lg border border-indigo-800/40 overflow-hidden">
      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 px-6 py-4 border-b border-indigo-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-white">AI Executive Summary: Q2 to Q3 Shift</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                Verified App Calculations Only
              </span>
            </div>
            <p className="text-xs text-indigo-200/70">
              Three-sentence intelligence brief analyzing which region changed most and the underlying drivers
            </p>
          </div>
        </div>

        {/* Action and Metric Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Rank metric toggle */}
          <div className="flex items-center bg-indigo-950/80 border border-indigo-700/40 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onMetricChange('dollar')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedMetric === 'dollar'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
              title="Rank by highest absolute dollar change"
            >
              Max $ Change
            </button>
            <button
              onClick={() => onMetricChange('percent')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedMetric === 'percent'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
              title="Rank by highest percentage change"
            >
              Max % Change
            </button>
          </div>

          <button
            onClick={generateSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/40 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50"
            title="Regenerate Summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Regenerate'}</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!summaryData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50"
            title="Copy 3-Sentence Summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="relative z-10 p-6">
        {loading && (
          <div className="py-6 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Synthesizing calculated regional drivers into exactly three sentences...</span>
            </div>
            <div className="h-4 bg-indigo-900/50 rounded-md w-full animate-pulse" />
            <div className="h-4 bg-indigo-900/50 rounded-md w-11/12 animate-pulse" />
            <div className="h-4 bg-indigo-900/50 rounded-md w-4/5 animate-pulse" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Unable to generate summary:</span>
              <p>{error}</p>
              <button
                onClick={generateSummary}
                className="mt-2 inline-flex items-center gap-1 text-rose-200 underline hover:text-white"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && summaryData && (
          <div className="space-y-5">
            {/* The 3-Sentence Executive Text */}
            <div className="space-y-3">
              {sentences.length === 3 ? (
                // Highlighted 3-sentence presentation
                <div className="grid grid-cols-1 gap-2.5">
                  {sentences.map((sentence, idx) => {
                    const badges = [
                      'Sentence 1: Region & Revenue Delta',
                      'Sentence 2: Product & Channel Drivers',
                      'Sentence 3: Volume & Discount Context',
                    ];
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-white/5 border border-indigo-700/30 hover:border-indigo-500/40 hover:bg-white/[0.07] transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            {badges[idx] || `Sentence ${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-sm md:text-base leading-relaxed text-indigo-50 font-normal">
                          {sentence}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Unified paragraph display if sentence boundary parsing varies
                <div className="p-4 rounded-lg bg-white/5 border border-indigo-700/30">
                  <p className="text-sm md:text-base leading-relaxed text-indigo-50 font-normal">
                    {summaryData.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Metrics Bar showing the Ground Truth used */}
            {summaryData.verifiedNumbers && (
              <div className="pt-3 border-t border-indigo-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-indigo-300/70 font-medium">Verified Numbers:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/40 text-indigo-200 font-mono">
                    Region: {summaryData.verifiedNumbers.region}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/40 text-indigo-200 font-mono">
                    Q2: ${summaryData.verifiedNumbers.q2Revenue.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/40 text-indigo-200 font-mono">
                    Q3: ${summaryData.verifiedNumbers.q3Revenue.toLocaleString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-semibold ${
                      summaryData.verifiedNumbers.dollarDelta >= 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    Δ: {summaryData.verifiedNumbers.dollarDelta >= 0 ? '+' : ''}$
                    {summaryData.verifiedNumbers.dollarDelta.toLocaleString()} (
                    {summaryData.verifiedNumbers.pctDelta >= 0 ? '+' : ''}
                    {summaryData.verifiedNumbers.pctDelta.toFixed(1)}%)
                  </span>
                </div>

                {/* Audit Drawer Toggle */}
                <button
                  onClick={() => setShowAuditDrawer(!showAuditDrawer)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showAuditDrawer ? 'Hide Ground Truth Calculations' : 'View Ground Truth Calculations'}</span>
                  {showAuditDrawer ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Collapsible Audit Drawer showing the prompt context fed to Gemini */}
            {showAuditDrawer && summaryData.calculatedContext && (
              <div className="mt-3 p-4 bg-slate-950/80 rounded-lg border border-indigo-800/50 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-900/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">
                      Calculated Data Context Provided to Gemini Prompt
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Rule enforced: AI constrained to these figures exclusively
                  </span>
                </div>
                <pre className="font-mono text-[11px] text-indigo-200/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 p-2 bg-slate-900 rounded border border-slate-800">
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
