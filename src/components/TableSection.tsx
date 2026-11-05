import React, { useState } from 'react';
import { SalesAnalysisResult } from '../types/sales';
import {
  Table as TableIcon,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface TableSectionProps {
  analysis: SalesAnalysisResult;
  selectedMoverRegion?: string | null;
  onSelectRegion?: (region: string) => void;
}

export const TableSection: React.FC<TableSectionProps> = ({
  analysis,
  selectedMoverRegion,
  onSelectRegion,
}) => {
  const { regions, quarters, matrix, quarterTotals, regionTotals, grandTotalRevenue, hasQ2AndQ3, q2q3AnalysisList } =
    analysis;

  const [sortField, setSortField] = useState<string>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Helper dictionary for quick Q2-Q3 delta lookup
  const q2q3Map = React.useMemo(() => {
    const map = new Map<string, (typeof q2q3AnalysisList)[0]>();
    q2q3AnalysisList.forEach((item) => map.set(item.region, item));
    return map;
  }, [q2q3AnalysisList]);

  // Sorting
  const sortedRegions = React.useMemo(() => {
    return [...regions].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'region') {
        return sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      } else if (sortField === 'total') {
        valA = regionTotals[a] || 0;
        valB = regionTotals[b] || 0;
      } else if (sortField === 'q2q3_delta') {
        valA = q2q3Map.get(a)?.dollarDelta || 0;
        valB = q2q3Map.get(b)?.dollarDelta || 0;
      } else if (sortField === 'q2q3_pct') {
        valA = q2q3Map.get(a)?.pctDelta || 0;
        valB = q2q3Map.get(b)?.pctDelta || 0;
      } else {
        // Quarter column
        valA = matrix[a]?.[sortField]?.revenue || 0;
        valB = matrix[b]?.[sortField]?.revenue || 0;
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [regions, sortField, sortDirection, regionTotals, q2q3Map, matrix]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatPct = (val: number): string => {
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(1)}%`;
  };

  // Export current table to CSV
  const handleExportCsv = () => {
    const headers = ['Region', ...quarters, 'Total Revenue', ...(hasQ2AndQ3 ? ['Q2->Q3 Delta ($)', 'Q2->Q3 Delta (%)'] : [])];
    const rows = sortedRegions.map((region) => {
      const qValues = quarters.map((q) => (matrix[region]?.[q]?.revenue || 0).toFixed(2));
      const total = (regionTotals[region] || 0).toFixed(2);
      const q2q3 = q2q3Map.get(region);
      const deltaDollar = q2q3 ? q2q3.dollarDelta.toFixed(2) : '0';
      const deltaPct = q2q3 ? q2q3.pctDelta.toFixed(2) + '%' : '0%';

      return [
        `"${region}"`,
        ...qValues,
        total,
        ...(hasQ2AndQ3 ? [deltaDollar, `"${deltaPct}"`] : []),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'regional_quarterly_sales_table.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy table to clipboard
  const handleCopyTable = () => {
    const headers = ['Region', ...quarters, 'Total Revenue', ...(hasQ2AndQ3 ? ['Q2->Q3 Delta ($)', 'Q2->Q3 Delta (%)'] : [])];
    const rows = sortedRegions.map((region) => {
      const qValues = quarters.map((q) => formatCurrency(matrix[region]?.[q]?.revenue || 0));
      const total = formatCurrency(regionTotals[region] || 0);
      const q2q3 = q2q3Map.get(region);
      const deltaDollar = q2q3 ? formatCurrency(q2q3.dollarDelta) : '-';
      const deltaPct = q2q3 ? formatPct(q2q3.pctDelta) : '-';

      return [region, ...qValues, total, ...(hasQ2AndQ3 ? [deltaDollar, deltaPct] : [])].join('\t');
    });

    const text = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Total Revenue by Region & Quarter Table</h3>
            <p className="text-xs text-slate-500">
              Interactive pivot table with Q2 to Q3 performance differentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
            title="Copy Table to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Viewport */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
              <th
                onClick={() => handleSort('region')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {quarters.map((q) => {
                const isQ2orQ3 = q === 'Q2' || q === 'Q3';
                return (
                  <th
                    key={q}
                    onClick={() => handleSort(q)}
                    className={`py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors ${
                      isQ2orQ3 ? 'bg-amber-50/50 text-amber-900' : ''
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{q} Revenue</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                );
              })}

              <th
                onClick={() => handleSort('total')}
                className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors bg-slate-100/60 font-bold"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {hasQ2AndQ3 && (
                <>
                  <th
                    onClick={() => handleSort('q2q3_delta')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-amber-100/60 transition-colors bg-amber-50 text-amber-900 font-bold border-l border-amber-200"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2 → Q3 Δ ($)</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-600" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('q2q3_pct')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-amber-100/60 transition-colors bg-amber-50 text-amber-900 font-bold"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2 → Q3 Δ (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-600" />
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedRegions.map((region) => {
              const q2q3 = q2q3Map.get(region);
              const isSelected = selectedMoverRegion === region;
              const isExpanded = expandedRegion === region;
              const isLargest = analysis.largestByDollar?.region === region;

              return (
                <React.Fragment key={region}>
                  <tr
                    className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 font-medium' : ''
                    }`}
                    onClick={() => {
                      if (onSelectRegion) onSelectRegion(region);
                      setExpandedRegion(isExpanded ? null : region);
                    }}
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRegion(isExpanded ? null : region);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span>{region}</span>
                        {isLargest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Sparkles className="w-2.5 h-2.5" />
                            Top Mover
                          </span>
                        )}
                      </div>
                    </td>

                    {quarters.map((q) => {
                      const data = matrix[region]?.[q];
                      const rev = data?.revenue || 0;
                      const isQ2orQ3 = q === 'Q2' || q === 'Q3';

                      return (
                        <td
                          key={q}
                          className={`py-3.5 px-4 text-right font-mono ${
                            isQ2orQ3 ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {formatCurrency(rev)}
                        </td>
                      );
                    })}

                    {/* Total Revenue */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 bg-slate-50/40">
                      {formatCurrency(regionTotals[region] || 0)}
                    </td>

                    {/* Q2 -> Q3 Delta Columns */}
                    {hasQ2AndQ3 && q2q3 && (
                      <>
                        <td className="py-3.5 px-4 text-right font-mono border-l border-slate-100 bg-amber-50/30">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs ${
                              q2q3.dollarDelta >= 0
                                ? 'bg-emerald-100/80 text-emerald-800'
                                : 'bg-rose-100/80 text-rose-800'
                            }`}
                          >
                            {q2q3.dollarDelta >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {formatCurrency(q2q3.dollarDelta)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono bg-amber-50/30">
                          <span
                            className={`font-semibold text-xs ${
                              q2q3.pctDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {formatPct(q2q3.pctDelta)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>

                  {/* Expanded Drawer: Product and Channel drivers for this region */}
                  {isExpanded && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={quarters.length + (hasQ2AndQ3 ? 4 : 2)} className="p-4 pl-12 border-b border-slate-200">
                        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">
                              Detailed Q2 → Q3 Drivers in {region}
                            </span>
                            <span className="text-xs text-slate-400">
                              Click any row again to collapse
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Product Breakdown */}
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-2">
                                Products (Q2 vs Q3 Revenue Shift):
                              </p>
                              {q2q3?.topProductDrivers && q2q3.topProductDrivers.length > 0 ? (
                                <div className="space-y-1.5">
                                  {q2q3.topProductDrivers.map((p) => (
                                    <div
                                      key={p.name}
                                      className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100"
                                    >
                                      <span className="font-medium text-slate-800">{p.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-slate-500 font-mono">
                                          {formatCurrency(p.q2Revenue)} → {formatCurrency(p.q3Revenue)}
                                        </span>
                                        <span
                                          className={`font-mono font-semibold ${
                                            p.dollarDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                          }`}
                                        >
                                          {formatCurrency(p.dollarDelta)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No Q2/Q3 product delta</p>
                              )}
                            </div>

                            {/* Channel Breakdown */}
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-2">
                                Channels (Q2 vs Q3 Revenue Shift):
                              </p>
                              {q2q3?.topChannelDrivers && q2q3.topChannelDrivers.length > 0 ? (
                                <div className="space-y-1.5">
                                  {q2q3.topChannelDrivers.map((c) => (
                                    <div
                                      key={c.name}
                                      className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100"
                                    >
                                      <span className="font-medium text-slate-800">{c.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-slate-500 font-mono">
                                          {formatCurrency(c.q2Revenue)} → {formatCurrency(c.q3Revenue)}
                                        </span>
                                        <span
                                          className={`font-mono font-semibold ${
                                            c.dollarDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                          }`}
                                        >
                                          {formatCurrency(c.dollarDelta)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No Q2/Q3 channel delta</p>
                              )}
                            </div>
                          </div>

                          {/* Extra Volume & Discount telemetry */}
                          {q2q3 && (
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
                              <div>
                                <span className="text-slate-400">Total Units:</span>{' '}
                                <span className="font-mono font-medium">
                                  Q2 {q2q3.q2Units.toLocaleString()} → Q3 {q2q3.q3Units.toLocaleString()} (
                                  {q2q3.deltaUnits >= 0 ? '+' : ''}
                                  {q2q3.deltaUnits.toLocaleString()} units)
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">Avg Discount:</span>{' '}
                                <span className="font-mono font-medium">
                                  Q2 {q2q3.q2AvgDiscountPct.toFixed(1)}% → Q3 {q2q3.q3AvgDiscountPct.toFixed(1)}% (
                                  {q2q3.deltaDiscountPctPoint >= 0 ? '+' : ''}
                                  {q2q3.deltaDiscountPctPoint.toFixed(1)} pts)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Grand Totals Summary Row */}
          <tfoot>
            <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
              <td className="py-4 px-4 text-slate-900">Grand Total</td>
              {quarters.map((q) => (
                <td key={q} className="py-4 px-4 text-right font-mono">
                  {formatCurrency(quarterTotals[q] || 0)}
                </td>
              ))}
              <td className="py-4 px-4 text-right font-mono bg-slate-200/50">
                {formatCurrency(grandTotalRevenue)}
              </td>
              {hasQ2AndQ3 && (
                <>
                  <td className="py-4 px-4 text-right font-mono border-l border-slate-200 bg-amber-100/30">
                    {(() => {
                      const totalQ2 = quarterTotals['Q2'] || 0;
                      const totalQ3 = quarterTotals['Q3'] || 0;
                      const delta = totalQ3 - totalQ2;
                      return (
                        <span className={delta >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                          {formatCurrency(delta)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-4 text-right font-mono bg-amber-100/30">
                    {(() => {
                      const totalQ2 = quarterTotals['Q2'] || 0;
                      const totalQ3 = quarterTotals['Q3'] || 0;
                      const pct = totalQ2 > 0 ? ((totalQ3 - totalQ2) / totalQ2) * 100 : 0;
                      return (
                        <span className={pct >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                          {formatPct(pct)}
                        </span>
                      );
                    })()}
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
