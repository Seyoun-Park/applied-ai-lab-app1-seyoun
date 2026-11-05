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
    <div className="bg-[#0e0e0e] border border-[#262626] text-[#e0e0e0] overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#222222] bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#ff8c00] text-sm tracking-wider uppercase">
            [05 // REGIONAL SALES FINANCIAL MATRIX &amp; VARIANCE LEDGER]
          </h3>
          <p className="text-[11px] text-[#777777] font-mono mt-0.5">
            Cross-tabulated quarterly pivot table with Q2 → Q3 variance analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyTable}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#e0e0e0] bg-[#1a1a1a] hover:bg-[#252525] border border-[#3a3a3a] hover:border-[#ff8c00] transition-all cursor-pointer font-mono"
            title="Copy Table to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00ff66]" /> : <Copy className="w-3.5 h-3.5 text-[#ff8c00]" />}
            <span>{copied ? 'COPIED' : 'COPY &lt;CLIP&gt;'}</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold text-black bg-[#ff8c00] hover:bg-[#ffa000] transition-all cursor-pointer font-mono tracking-wider"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV &lt;F10&gt;</span>
          </button>
        </div>
      </div>

      {/* Terminal Pivot Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-[#181818] border-b-2 border-[#2b2b2b] text-[#888888] uppercase tracking-wider text-[11px]">
              <th
                onClick={() => handleSort('region')}
                className="py-2.5 px-3 cursor-pointer hover:bg-[#222222] text-[#ff8c00] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>REGION</span>
                  <ArrowUpDown className="w-3 h-3 text-[#ff8c00]" />
                </div>
              </th>

              {quarters.map((q) => {
                const isQ2orQ3 = q === 'Q2' || q === 'Q3';
                return (
                  <th
                    key={q}
                    onClick={() => handleSort(q)}
                    className={`py-2.5 px-3 text-right cursor-pointer hover:bg-[#222222] transition-colors ${
                      isQ2orQ3 ? 'text-[#ffcc00] bg-[#1c1608]' : 'text-white'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{q} REV {isQ2orQ3 ? '*' : ''}</span>
                      <ArrowUpDown className="w-3 h-3 text-[#555555]" />
                    </div>
                  </th>
                );
              })}

              <th
                onClick={() => handleSort('total')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-[#222222] transition-colors text-[#00e5ff] font-bold bg-[#141b22]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>TOTAL REV</span>
                  <ArrowUpDown className="w-3 h-3 text-[#00e5ff]" />
                </div>
              </th>

              {hasQ2AndQ3 && (
                <>
                  <th
                    onClick={() => handleSort('q2q3_delta')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-[#222222] transition-colors text-[#ffd700] font-bold border-l border-[#262626] bg-[#1a1506]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2→Q3 Δ ($)</span>
                      <ArrowUpDown className="w-3 h-3 text-[#ffd700]" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('q2q3_pct')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-[#222222] transition-colors text-[#ffd700] font-bold bg-[#1a1506]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2→Q3 Δ (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-[#ffd700]" />
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#181818] text-[#cccccc]">
            {sortedRegions.map((region, rIdx) => {
              const q2q3 = q2q3Map.get(region);
              const isSelected = selectedMoverRegion === region;
              const isExpanded = expandedRegion === region;
              const isLargest = analysis.largestByDollar?.region === region;

              return (
                <React.Fragment key={region}>
                  <tr
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1c1800] text-white'
                        : rIdx % 2 === 0
                        ? 'bg-[#0a0a0a] hover:bg-[#141414]'
                        : 'bg-[#0f0f0f] hover:bg-[#141414]'
                    }`}
                    onClick={() => {
                      if (onSelectRegion) onSelectRegion(region);
                      setExpandedRegion(isExpanded ? null : region);
                    }}
                  >
                    <td className="py-2.5 px-3 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="p-0.5 hover:bg-[#262626] text-[#ff8c00] transition-colors"
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
                          <span className="text-[10px] text-[#ff8c00] font-extrabold border border-[#ff8c00]/50 px-1 py-0.2 bg-[#ff8c00]/10 ml-1">
                            LEAD MOVER
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
                          className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                            isQ2orQ3 ? 'bg-[#141005] text-[#ffea88]' : 'text-[#ffffff]'
                          }`}
                        >
                          {formatCurrency(rev)}
                        </td>
                      );
                    })}

                    {/* Total Revenue */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#00e5ff] bg-[#0c141c]">
                      {formatCurrency(regionTotals[region] || 0)}
                    </td>

                    {/* Q2 -> Q3 Delta Columns */}
                    {hasQ2AndQ3 && q2q3 && (
                      <>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums border-l border-[#222222] bg-[#120e03]">
                          <span
                            className={`font-bold inline-flex items-center gap-1 ${
                              q2q3.dollarDelta >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'
                            }`}
                          >
                            {q2q3.dollarDelta >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-[#00ff66]" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-[#ff3b30]" />
                            )}
                            {q2q3.dollarDelta >= 0 ? '+' : ''}
                            {formatCurrency(q2q3.dollarDelta)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums bg-[#120e03]">
                          <span
                            className={`font-bold ${
                              q2q3.pctDelta >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'
                            }`}
                          >
                            {formatPct(q2q3.pctDelta)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>

                  {/* Expanded Drawer: Terminal Sub-ledger breakdown for this region */}
                  {isExpanded && (
                    <tr className="bg-[#050505]">
                      <td colSpan={quarters.length + (hasQ2AndQ3 ? 3 : 2)} className="p-3 pl-8 border-y border-[#262626]">
                        <div className="bg-[#0a0a0a] border border-[#ff8c00]/40 p-3 space-y-2.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-[#ff8c00]">
                              [SUB-LEDGER: Q2 → Q3 DRIVER DECOMPOSITION &middot; {region}]
                            </span>
                            <span className="text-[10px] text-[#666666]">
                              [CLICK ROW TO COLLAPSE]
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Product Breakdown */}
                            <div>
                              <p className="text-[11px] font-bold text-[#e0e0e0] mb-1.5 uppercase">
                                [PRODUCTS // Q2 vs Q3 VARIANCE]:
                              </p>
                              {q2q3?.topProductDrivers && q2q3.topProductDrivers.length > 0 ? (
                                <div className="space-y-1">
                                  {q2q3.topProductDrivers.map((p) => (
                                    <div
                                      key={p.name}
                                      className="flex items-center justify-between text-[11px] p-1.5 bg-[#121212] border border-[#1e1e1e]"
                                    >
                                      <span className="font-semibold text-white">{p.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[#888888] font-mono tabular-nums">
                                          {formatCurrency(p.q2Revenue)} → {formatCurrency(p.q3Revenue)}
                                        </span>
                                        <span
                                          className={`font-mono tabular-nums font-bold ${
                                            p.dollarDelta >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'
                                          }`}
                                        >
                                          {p.dollarDelta >= 0 ? '+' : ''}{formatCurrency(p.dollarDelta)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#666666] italic font-mono">No product delta recorded</p>
                              )}
                            </div>

                            {/* Channel Breakdown */}
                            <div>
                              <p className="text-[11px] font-bold text-[#e0e0e0] mb-1.5 uppercase">
                                [CHANNELS // Q2 vs Q3 VARIANCE]:
                              </p>
                              {q2q3?.topChannelDrivers && q2q3.topChannelDrivers.length > 0 ? (
                                <div className="space-y-1">
                                  {q2q3.topChannelDrivers.map((c) => (
                                    <div
                                      key={c.name}
                                      className="flex items-center justify-between text-[11px] p-1.5 bg-[#121212] border border-[#1e1e1e]"
                                    >
                                      <span className="font-semibold text-[#00e5ff]">{c.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[#888888] font-mono tabular-nums">
                                          {formatCurrency(c.q2Revenue)} → {formatCurrency(c.q3Revenue)}
                                        </span>
                                        <span
                                          className={`font-mono tabular-nums font-bold ${
                                            c.dollarDelta >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'
                                          }`}
                                        >
                                          {c.dollarDelta >= 0 ? '+' : ''}{formatCurrency(c.dollarDelta)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#666666] italic font-mono">No channel delta recorded</p>
                              )}
                            </div>
                          </div>

                          {/* Extra Volume & Discount telemetry */}
                          {q2q3 && (
                            <div className="pt-2 border-t border-[#1e1e1e] flex flex-wrap gap-4 text-[11px] text-[#888888]">
                              <div>
                                <span className="text-[#ff8c00]">TOTAL VOLUME:</span>{' '}
                                <span className="font-mono text-white tabular-nums">
                                  Q2 {q2q3.q2Units.toLocaleString()} → Q3 {q2q3.q3Units.toLocaleString()} (
                                  {q2q3.deltaUnits >= 0 ? '+' : ''}
                                  {q2q3.deltaUnits.toLocaleString()} units)
                                </span>
                              </div>
                              <div>
                                <span className="text-[#ff8c00]">AVG DISCOUNT:</span>{' '}
                                <span className="font-mono text-white tabular-nums">
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
            <tr className="bg-[#141414] font-bold text-white border-t-2 border-[#ff8c00]">
              <td className="py-3 px-3 text-[#ff8c00] uppercase font-extrabold tracking-wider">
                GRAND TOTAL
              </td>
              {quarters.map((q) => (
                <td key={q} className="py-3 px-3 text-right font-mono tabular-nums text-white">
                  {formatCurrency(quarterTotals[q] || 0)}
                </td>
              ))}
              <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-[#00e5ff] bg-[#0f1b26]">
                {formatCurrency(grandTotalRevenue)}
              </td>
              {hasQ2AndQ3 && (
                <>
                  <td className="py-3 px-3 text-right font-mono tabular-nums border-l border-[#262626] bg-[#1a1400]">
                    {(() => {
                      const totalQ2 = quarterTotals['Q2'] || 0;
                      const totalQ3 = quarterTotals['Q3'] || 0;
                      const delta = totalQ3 - totalQ2;
                      return (
                        <span className={`font-bold ${delta >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'}`}>
                          {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums bg-[#1a1400]">
                    {(() => {
                      const totalQ2 = quarterTotals['Q2'] || 0;
                      const totalQ3 = quarterTotals['Q3'] || 0;
                      const pct = totalQ2 > 0 ? ((totalQ3 - totalQ2) / totalQ2) * 100 : 0;
                      return (
                        <span className={`font-bold ${pct >= 0 ? 'text-[#00ff66]' : 'text-[#ff3b30]'}`}>
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
