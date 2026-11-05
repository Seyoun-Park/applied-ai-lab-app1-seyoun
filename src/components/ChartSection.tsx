import React, { useState, useMemo } from 'react';
import { SalesAnalysisResult } from '../types/sales';
import { BarChart3, TrendingUp, Layers, Info } from 'lucide-react';

interface ChartSectionProps {
  analysis: SalesAnalysisResult;
}

// Crisp, accessible enterprise color palette for regions
const REGION_COLORS = [
  { bg: '#3B82F6', hover: '#2563EB', text: 'text-blue-600', light: 'bg-blue-50 border-blue-200' }, // Blue
  { bg: '#10B981', hover: '#059669', text: 'text-emerald-600', light: 'bg-emerald-50 border-emerald-200' }, // Emerald
  { bg: '#8B5CF6', hover: '#7C3AED', text: 'text-purple-600', light: 'bg-purple-50 border-purple-200' }, // Purple
  { bg: '#F59E0B', hover: '#D97706', text: 'text-amber-600', light: 'bg-amber-50 border-amber-200' }, // Amber
  { bg: '#EC4899', hover: '#DB2777', text: 'text-pink-600', light: 'bg-pink-50 border-pink-200' }, // Pink
  { bg: '#06B6D4', hover: '#0891B2', text: 'text-cyan-600', light: 'bg-cyan-50 border-cyan-200' }, // Cyan
];

const formatCurrency = (val: number): string => {
  if (val >= 1000000) {
    return `$${(val / 1000000).toFixed(2)}M`;
  }
  if (val >= 1000) {
    return `$${(val / 1000).toFixed(0)}k`;
  }
  return `$${val.toLocaleString()}`;
};

export const ChartSection: React.FC<ChartSectionProps> = ({ analysis }) => {
  const [chartType, setChartType] = useState<'grouped' | 'stacked' | 'by-region'>('grouped');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{
    quarter: string;
    region: string;
    revenue: number;
    units: number;
    pctOfQuarter: number;
    x: number;
    y: number;
  } | null>(null);

  const { regions, quarters, matrix, quarterTotals } = analysis;

  // Region color mapping
  const regionColorMap = useMemo(() => {
    const map: Record<string, (typeof REGION_COLORS)[0]> = {};
    regions.forEach((r, idx) => {
      map[r] = REGION_COLORS[idx % REGION_COLORS.length];
    });
    return map;
  }, [regions]);

  // Determine Max values for SVG scaling
  const maxGroupedRevenue = useMemo(() => {
    let max = 0;
    regions.forEach((r) => {
      quarters.forEach((q) => {
        const val = matrix[r]?.[q]?.revenue || 0;
        if (val > max) max = val;
      });
    });
    return max > 0 ? max * 1.15 : 100000;
  }, [regions, quarters, matrix]);

  const maxStackedRevenue = useMemo(() => {
    let max = 0;
    quarters.forEach((q) => {
      const val = quarterTotals[q] || 0;
      if (val > max) max = val;
    });
    return max > 0 ? max * 1.15 : 100000;
  }, [quarters, quarterTotals]);

  // Chart dimensions
  const svgWidth = 840;
  const svgHeight = 360;
  const padding = { top: 40, right: 30, bottom: 50, left: 75 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden p-6 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Total Revenue by Region and Quarter</h3>
              <p className="text-xs text-slate-500">
                Visualizing quarterly sales distributions and regional trajectory
              </p>
            </div>
          </div>
        </div>

        {/* Chart View Mode Selector */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-lg text-xs font-medium text-slate-600 self-start sm:self-auto">
          <button
            onClick={() => setChartType('grouped')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              chartType === 'grouped'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Grouped Bars
          </button>
          <button
            onClick={() => setChartType('stacked')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              chartType === 'stacked'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Stacked Total
          </button>
          <button
            onClick={() => setChartType('by-region')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              chartType === 'by-region'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Group by Region
          </button>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex flex-wrap items-center gap-2 pt-4 pb-2">
        <span className="text-xs font-medium text-slate-400 mr-1">Regions:</span>
        {regions.map((region) => {
          const color = regionColorMap[region];
          const isSelected = activeRegion === region;
          return (
            <button
              key={region}
              onClick={() => setActiveRegion(isSelected ? null : region)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? 'border-slate-800 bg-slate-900 text-white shadow-xs'
                  : activeRegion !== null
                  ? 'opacity-40 border-slate-200 bg-white text-slate-600 hover:opacity-80'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color?.bg || '#94A3B8' }}
              />
              <span>{region}</span>
              {isSelected && <span className="text-[10px] ml-1 bg-slate-700 px-1 rounded">Filtered</span>}
            </button>
          );
        })}
        {activeRegion && (
          <button
            onClick={() => setActiveRegion(null)}
            className="text-xs text-blue-600 hover:underline ml-2"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* SVG Chart Container */}
      <div className="relative mt-2 w-full overflow-x-auto">
        <div className="min-w-[700px]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none overflow-visible"
          >
            {/* Background Grid Lines & Y-Axis Labels */}
            {yTicks.map((tickRatio) => {
              const currentMax = chartType === 'stacked' ? maxStackedRevenue : maxGroupedRevenue;
              const val = currentMax * tickRatio;
              const y = padding.top + innerHeight * (1 - tickRatio);

              return (
                <g key={tickRatio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + innerWidth}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray={tickRatio === 0 ? 'none' : '3 3'}
                    strokeWidth={tickRatio === 0 ? 1.5 : 1}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748B"
                    className="font-mono"
                  >
                    {formatCurrency(val)}
                  </text>
                </g>
              );
            })}

            {/* Render Bars based on chart mode */}
            {chartType === 'grouped' && (
              // Grouped by Quarter on X-Axis
              quarters.map((quarter, qIdx) => {
                const groupWidth = innerWidth / quarters.length;
                const groupX = padding.left + qIdx * groupWidth;
                const visibleRegions = activeRegion ? [activeRegion] : regions;
                const barWidth = Math.min(36, (groupWidth * 0.75) / (visibleRegions.length || 1));
                const totalBarSpan = barWidth * visibleRegions.length;
                const startX = groupX + (groupWidth - totalBarSpan) / 2;

                const isQ2orQ3 = quarter === 'Q2' || quarter === 'Q3';

                return (
                  <g key={quarter}>
                    {/* Quarter highlight band for Q2 / Q3 */}
                    {isQ2orQ3 && (
                      <rect
                        x={groupX + 4}
                        y={padding.top}
                        width={groupWidth - 8}
                        height={innerHeight}
                        fill="#F8FAFC"
                        rx="4"
                        opacity={0.8}
                      />
                    )}

                    {/* Bars for each region */}
                    {visibleRegions.map((region, rIdx) => {
                      const data = matrix[region]?.[quarter];
                      const revenue = data?.revenue || 0;
                      const barHeight = Math.max(
                        0,
                        (revenue / maxGroupedRevenue) * innerHeight
                      );
                      const barX = startX + rIdx * barWidth;
                      const barY = padding.top + innerHeight - barHeight;
                      const color = regionColorMap[region];
                      const qTotal = quarterTotals[quarter] || 1;
                      const pctOfQuarter = (revenue / qTotal) * 100;

                      return (
                        <g key={region}>
                          <rect
                            x={barX + 2}
                            y={barY}
                            width={barWidth - 4}
                            height={barHeight}
                            fill={color?.bg || '#3B82F6'}
                            rx="3"
                            className="transition-all duration-200 cursor-pointer hover:opacity-90"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredBar({
                                quarter,
                                region,
                                revenue,
                                units: data?.units || 0,
                                pctOfQuarter,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                        </g>
                      );
                    })}

                    {/* Quarter X-Axis Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - 15}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="600"
                      fill={isQ2orQ3 ? '#0F172A' : '#475569'}
                    >
                      {quarter}
                    </text>
                  </g>
                );
              })
            )}

            {chartType === 'stacked' && (
              // Stacked Bars by Quarter
              quarters.map((quarter, qIdx) => {
                const groupWidth = innerWidth / quarters.length;
                const groupX = padding.left + qIdx * groupWidth;
                const barWidth = Math.min(54, groupWidth * 0.45);
                const barX = groupX + (groupWidth - barWidth) / 2;
                const qTotal = quarterTotals[quarter] || 0;

                let currentStackHeight = 0;

                return (
                  <g key={quarter}>
                    {regions.map((region) => {
                      const data = matrix[region]?.[quarter];
                      const revenue = data?.revenue || 0;
                      if (revenue <= 0) return null;

                      if (activeRegion && activeRegion !== region) {
                        return null;
                      }

                      const segmentHeight = (revenue / maxStackedRevenue) * innerHeight;
                      const segmentY = padding.top + innerHeight - currentStackHeight - segmentHeight;
                      currentStackHeight += segmentHeight;
                      const color = regionColorMap[region];
                      const pctOfQuarter = qTotal > 0 ? (revenue / qTotal) * 100 : 0;

                      return (
                        <rect
                          key={region}
                          x={barX}
                          y={segmentY}
                          width={barWidth}
                          height={segmentHeight}
                          fill={color?.bg || '#3B82F6'}
                          stroke="#ffffff"
                          strokeWidth="1"
                          className="transition-all duration-200 cursor-pointer hover:opacity-90"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBar({
                              quarter,
                              region,
                              revenue,
                              units: data?.units || 0,
                              pctOfQuarter,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      );
                    })}

                    {/* Total on top of stacked bar */}
                    {qTotal > 0 && (
                      <text
                        x={barX + barWidth / 2}
                        y={padding.top + innerHeight - currentStackHeight - 6}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#334155"
                        className="font-mono"
                      >
                        {formatCurrency(qTotal)}
                      </text>
                    )}

                    {/* Quarter Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - 15}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="600"
                      fill="#0F172A"
                    >
                      {quarter}
                    </text>
                  </g>
                );
              })
            )}

            {chartType === 'by-region' && (
              // Grouped by Region on X-Axis
              regions.map((region, rIdx) => {
                const groupWidth = innerWidth / regions.length;
                const groupX = padding.left + rIdx * groupWidth;
                const barWidth = Math.min(26, (groupWidth * 0.75) / (quarters.length || 1));
                const totalBarSpan = barWidth * quarters.length;
                const startX = groupX + (groupWidth - totalBarSpan) / 2;
                const color = regionColorMap[region];

                return (
                  <g key={region}>
                    {quarters.map((quarter, qIdx) => {
                      const data = matrix[region]?.[quarter];
                      const revenue = data?.revenue || 0;
                      const barHeight = Math.max(0, (revenue / maxGroupedRevenue) * innerHeight);
                      const barX = startX + qIdx * barWidth;
                      const barY = padding.top + innerHeight - barHeight;
                      const qTotal = quarterTotals[quarter] || 1;
                      const pctOfQuarter = (revenue / qTotal) * 100;

                      // Use lighter shades for different quarters
                      const quarterOpacity = 0.4 + (qIdx / (quarters.length - 1 || 1)) * 0.6;

                      return (
                        <g key={quarter}>
                          <rect
                            x={barX + 1}
                            y={barY}
                            width={barWidth - 2}
                            height={barHeight}
                            fill={color?.bg || '#3B82F6'}
                            opacity={quarterOpacity}
                            rx="2"
                            className="cursor-pointer transition-all hover:opacity-100"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredBar({
                                quarter,
                                region,
                                revenue,
                                units: data?.units || 0,
                                pctOfQuarter,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                        </g>
                      );
                    })}

                    {/* Region Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - 15}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#0F172A"
                    >
                      {region}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredBar && (
          <div
            className="fixed pointer-events-none z-50 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl border border-slate-700 transform -translate-x-1/2 -translate-y-full -mt-2 transition-all"
            style={{ left: hoveredBar.x, top: hoveredBar.y }}
          >
            <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1">
              <span className="font-semibold text-slate-100">{hoveredBar.region}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                {hoveredBar.quarter}
              </span>
            </div>
            <div className="space-y-0.5 text-slate-300">
              <div className="flex justify-between gap-4">
                <span>Revenue:</span>
                <span className="font-semibold text-white font-mono">
                  ${hoveredBar.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Units Sold:</span>
                <span className="font-mono text-slate-200">
                  {hoveredBar.units.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Quarter Share:</span>
                <span className="font-mono text-emerald-400">
                  {hoveredBar.pctOfQuarter.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Q2 vs Q3 Notice */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Hover over any bar to inspect exact revenue, volume, and quarter share.</span>
        </div>
        {analysis.hasQ2AndQ3 && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-medium">
            <span>Focus Area: Q2 to Q3 transition highlighted</span>
          </div>
        )}
      </div>
    </div>
  );
};
