import React from 'react';
import { SalesAnalysisResult } from '../types/sales';
import { DollarSign, Globe2, TrendingUp, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 01. Grand Total Revenue */}
      <div className="bg-[#0e0e0e] border border-[#262626] hover:border-[#ff8c00]/60 p-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c] mb-2.5">
          <span className="text-[10px] font-bold tracking-wider text-[#ff8c00] flex items-center gap-1.5 uppercase">
            <span>[REV.TOT]</span>
            <span>TOTAL REVENUE</span>
          </span>
          <span className="text-[10px] text-[#555555]">CUMULATIVE</span>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className="text-2xl font-bold text-[#ffffff] font-mono tabular-nums tracking-tight">
            {formatCurrency(grandTotalRevenue)}
          </h4>
        </div>
        <div className="mt-2 text-[11px] text-[#777777] flex items-center justify-between border-t border-[#161616] pt-1.5">
          <span>SAMPLE SIZE</span>
          <span className="text-[#cccccc] font-semibold">{records.length.toLocaleString()} ORDERS</span>
        </div>
      </div>

      {/* 02. Top Region */}
      <div className="bg-[#0e0e0e] border border-[#262626] hover:border-[#00e5ff]/60 p-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c] mb-2.5">
          <span className="text-[10px] font-bold tracking-wider text-[#00e5ff] flex items-center gap-1.5 uppercase">
            <span>[REG.MAX]</span>
            <span>TOP REGIONAL MARKET</span>
          </span>
          <span className="text-[10px] text-[#555555]">LEADER</span>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className="text-xl font-bold text-[#ffffff] truncate max-w-[170px]" title={topRegionName}>
            {topRegionName}
          </h4>
        </div>
        <div className="mt-2 text-[11px] text-[#777777] flex items-center justify-between border-t border-[#161616] pt-1.5">
          <span className="text-[#888888]">{formatCurrency(topRegionRev)}</span>
          <span className="text-[#00e5ff] font-semibold tabular-nums">
            {grandTotalRevenue > 0 ? ((topRegionRev / grandTotalRevenue) * 100).toFixed(1) : 0}% SHARE
          </span>
        </div>
      </div>

      {/* 03. Biggest Q2 -> Q3 Mover */}
      <div className="bg-[#0e0e0e] border border-[#262626] hover:border-[#ffd700]/60 p-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c] mb-2.5">
          <span className="text-[10px] font-bold tracking-wider text-[#ffd700] flex items-center gap-1.5 uppercase">
            <span>[MOV.Q23]</span>
            <span>Q2 → Q3 TOP MOVER</span>
          </span>
          <span className="text-[10px] text-[#ff8c00] font-semibold">
            {selectedMetric === 'dollar' ? '$ DELTA' : '% DELTA'}
          </span>
        </div>
        {hasQ2AndQ3 && topMover ? (
          <>
            <div className="flex items-baseline justify-between">
              <h4 className="text-xl font-bold text-[#ffffff] truncate max-w-[170px]" title={topMover.region}>
                {topMover.region}
              </h4>
              <span
                className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                  topMover.dollarDelta >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'
                }`}
              >
                {topMover.dollarDelta >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {topMover.pctDelta >= 0 ? '+' : ''}
                {topMover.pctDelta.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-[#777777] flex items-center justify-between border-t border-[#161616] pt-1.5">
              <span>NET SHIFT</span>
              <span
                className={`font-semibold tabular-nums ${
                  topMover.dollarDelta >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'
                }`}
              >
                {topMover.dollarDelta >= 0 ? '+' : ''}
                {formatCurrency(topMover.dollarDelta)}
              </span>
            </div>
          </>
        ) : (
          <div className="py-2 text-xs text-[#555555]">AWAITING Q2 &amp; Q3 RECORDS</div>
        )}
      </div>

      {/* 04. Total Units Sold */}
      <div className="bg-[#0e0e0e] border border-[#262626] hover:border-[#00ff66]/60 p-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c] mb-2.5">
          <span className="text-[10px] font-bold tracking-wider text-[#00ff66] flex items-center gap-1.5 uppercase">
            <span>[VOL.TOT]</span>
            <span>TOTAL VOLUME</span>
          </span>
          <span className="text-[10px] text-[#555555]">UNITS</span>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className="text-2xl font-bold text-[#ffffff] font-mono tabular-nums tracking-tight">
            {grandTotalUnits.toLocaleString()}
          </h4>
        </div>
        <div className="mt-2 text-[11px] text-[#777777] flex items-center justify-between border-t border-[#161616] pt-1.5">
          <span>COVERAGE</span>
          <span className="text-[#cccccc] font-semibold">{analysis.regions.length} ACTIVE REGIONS</span>
        </div>
      </div>
    </div>
  );
};
