import React from 'react';
import { SalesAnalysisResult } from '../types/sales';
import { DollarSign, Globe2, TrendingUp, Package, Sparkles } from 'lucide-react';

interface KpiMetricsProps {
  analysis: SalesAnalysisResult;
  selectedMetric: 'dollar' | 'percent';
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ analysis, selectedMetric }) => {
  const {
    grandTotalRevenue,
    grandTotalUnits,
    regionTotals,
    largestByDollar,
    largestByPct,
    records,
    hasQ2AndQ3,
  } = analysis;

  // Best region by total revenue
  const topRegionEntry = Object.entries(regionTotals).sort((a, b) => b[1] - a[1])[0];
  const topRegionName = topRegionEntry ? topRegionEntry[0] : 'N/A';
  const topRegionRev = topRegionEntry ? topRegionEntry[1] : 0;

  const topMover = selectedMetric === 'dollar' ? largestByDollar : largestByPct;

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Grand Total Revenue */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Revenue
          </span>
          <h4 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
            {formatCurrency(grandTotalRevenue)}
          </h4>
          <span className="text-xs text-slate-400">
            Across {records.length} orders
          </span>
        </div>
      </div>

      {/* Top Region */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Globe2 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Top Overall Region
          </span>
          <h4 className="text-xl font-bold text-slate-900 mt-0.5 truncate max-w-[170px]" title={topRegionName}>
            {topRegionName}
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            {formatCurrency(topRegionRev)} (
            {grandTotalRevenue > 0 ? ((topRegionRev / grandTotalRevenue) * 100).toFixed(1) : 0}%)
          </span>
        </div>
      </div>

      {/* Biggest Q2 -> Q3 Mover */}
      <div className="bg-white rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Q2 → Q3 Top Mover
            </span>
          </div>
          {hasQ2AndQ3 && topMover ? (
            <>
              <h4 className="text-xl font-bold text-slate-900 mt-0.5 truncate max-w-[170px]" title={topMover.region}>
                {topMover.region}
              </h4>
              <span
                className={`text-xs font-mono font-semibold ${
                  topMover.dollarDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {topMover.dollarDelta >= 0 ? '+' : ''}
                {formatCurrency(topMover.dollarDelta)} ({topMover.pctDelta >= 0 ? '+' : ''}
                {topMover.pctDelta.toFixed(1)}%)
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400 mt-1 block">Requires Q2 & Q3</span>
          )}
        </div>
      </div>

      {/* Total Units Sold */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Units Sold
          </span>
          <h4 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
            {grandTotalUnits.toLocaleString()}
          </h4>
          <span className="text-xs text-slate-400">
            Across {analysis.regions.length} regions
          </span>
        </div>
      </div>
    </div>
  );
};
