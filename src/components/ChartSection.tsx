import React, { useState, useMemo } from 'react';
import { SalesAnalysisResult } from '../types/sales';
import { BarChart3, TrendingUp, Layers, Info } from 'lucide-react';

interface ChartSectionProps {
  analysis: SalesAnalysisResult;
}

// Iconic high-contrast Bloomberg Terminal palette for regions
const REGION_COLORS = [
  { bg: '#ff8c00', hover: '#ffa500', text: 'text-[#ff8c00]', name: 'Amber' },   // Bloomberg Orange
  { bg: '#00e5ff', hover: '#33eeff', text: 'text-[#00e5ff]', name: 'Cyan' },    // Bloomberg Cyan
  { bg: '#00ff66', hover: '#33ff88', text: 'text-[#00ff66]', name: 'Green' },   // Bloomberg Green
  { bg: '#ffd700', hover: '#ffe033', text: 'text-[#ffd700]', name: 'Yellow' },  // Bloomberg Gold
  { bg: '#ff3366', hover: '#ff5588', text: 'text-[#ff3366]', name: 'Coral' },   // Bloomberg Coral
  { bg: '#b388ff', hover: '#c49fff', text: 'text-[#b388ff]', name: 'Violet' },  // Bloomberg Violet
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
  const svgHeight = 350;
  const padding = { top: 35, right: 30, bottom: 45, left: 75 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-[#0e0e0e] border border-[#262626] p-4 text-[#e0e0e0] space-y-3.5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#222222] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#ff8c00] text-sm tracking-wider uppercase">
              [04 // GRAPHICAL REVENUE DISTRIBUTION &amp; REGIONAL TRAJECTORY]
            </h3>
          </div>
          <p className="text-[11px] text-[#777777] mt-0.5 font-mono">
            Quarterly revenue trajectory and cross-regional market volume
          </p>
        </div>

        {/* Chart View Mode Selector */}
        <div className="flex items-center bg-[#090909] border border-[#333333] p-0.5 text-xs font-mono self-start sm:self-auto">
          <button
            onClick={() => setChartType('grouped')}
            className={`px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
              chartType === 'grouped'
                ? 'bg-[#ff8c00] text-black font-extrabold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>GROUPED &lt;F5&gt;</span>
          </button>
          <button
            onClick={() => setChartType('stacked')}
            className={`px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
              chartType === 'stacked'
                ? 'bg-[#ff8c00] text-black font-extrabold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>STACKED &lt;F6&gt;</span>
          </button>
          <button
            onClick={() => setChartType('by-region')}
            className={`px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
              chartType === 'by-region'
                ? 'bg-[#ff8c00] text-black font-extrabold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>BY REGION &lt;F7&gt;</span>
          </button>
        </div>
      </div>

      {/* Terminal Interactive Legend */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-[11px] font-bold text-[#ff8c00] mr-1">[FILTER]:</span>
        {regions.map((region) => {
          const color = regionColorMap[region];
          const isSelected = activeRegion === region;
          return (
            <button
              key={region}
              onClick={() => setActiveRegion(isSelected ? null : region)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#ff8c00] bg-[#ff8c00]/20 text-[#ff8c00] font-bold'
                  : activeRegion !== null
                  ? 'opacity-30 border-[#222222] bg-[#111111] text-[#666666]'
                  : 'border-[#2a2a2a] bg-[#141414] text-[#cccccc] hover:border-[#444444]'
              }`}
            >
              <span
                className="w-2 h-2 inline-block"
                style={{ backgroundColor: color?.bg || '#94A3B8' }}
              />
              <span>{region}</span>
              {isSelected && <span className="text-[10px] text-[#ff8c00] font-bold ml-0.5">[ACTIVE]</span>}
            </button>
          );
        })}
        {activeRegion && (
          <button
            onClick={() => setActiveRegion(null)}
            className="text-[11px] text-[#00e5ff] hover:underline ml-2 cursor-pointer font-bold"
          >
            [SHOW ALL]
          </button>
        )}
      </div>

      {/* SVG Chart Container */}
      <div className="relative mt-2 w-full overflow-x-auto bg-[#070707] border border-[#1c1c1c] p-2">
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
                    stroke="#1a1a1a"
                    strokeDasharray={tickRatio === 0 ? 'none' : '2 3'}
                    strokeWidth={tickRatio === 0 ? 1.5 : 1}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#666666"
                    className="font-mono tabular-nums"
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
                const barWidth = Math.min(34, (groupWidth * 0.75) / (visibleRegions.length || 1));
                const totalBarSpan = barWidth * visibleRegions.length;
                const startX = groupX + (groupWidth - totalBarSpan) / 2;

                const isQ2orQ3 = quarter === 'Q2' || quarter === 'Q3';

                return (
                  <g key={quarter}>
                    {/* Quarter highlight band for Q2 / Q3 */}
                    {isQ2orQ3 && (
                      <rect
                        x={groupX + 2}
                        y={padding.top}
                        width={groupWidth - 4}
                        height={innerHeight}
                        fill="#1a1300"
                        stroke="#ff8c00"
                        strokeWidth="0.5"
                        strokeDasharray="2 2"
                        opacity={0.35}
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
                            x={barX + 1}
                            y={barY}
                            width={barWidth - 2}
                            height={barHeight}
                            fill={color?.bg || '#ff8c00'}
                            className="transition-opacity duration-150 cursor-pointer hover:opacity-80"
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
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill={isQ2orQ3 ? '#ff8c00' : '#888888'}
                      className="font-mono"
                    >
                      {quarter} {isQ2orQ3 ? '*' : ''}
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
                          fill={color?.bg || '#ff8c00'}
                          stroke="#000000"
                          strokeWidth="1"
                          className="transition-opacity duration-150 cursor-pointer hover:opacity-80"
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
                        fontSize="10"
                        fontWeight="bold"
                        fill="#00ff66"
                        className="font-mono tabular-nums"
                      >
                        {formatCurrency(qTotal)}
                      </text>
                    )}

                    {/* Quarter Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#ffffff"
                      className="font-mono"
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
                            fill={color?.bg || '#ff8c00'}
                            opacity={quarterOpacity}
                            className="cursor-pointer transition-opacity hover:opacity-100"
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
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#e0e0e0"
                      className="font-mono"
                    >
                      {region}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* Hover Tooltip Overlay (Bloomberg Terminal Box) */}
        {hoveredBar && (
          <div
            className="fixed pointer-events-none z-50 bg-[#000000] text-white px-3 py-2 text-xs shadow-2xl border border-[#ff8c00] transform -translate-x-1/2 -translate-y-full -mt-2 font-mono"
            style={{ left: hoveredBar.x, top: hoveredBar.y }}
          >
            <div className="flex items-center justify-between gap-4 mb-1 border-b border-[#333333] pb-1 text-[#ff8c00] font-bold text-[11px]">
              <span>[{hoveredBar.region.toUpperCase()}]</span>
              <span className="text-[#00e5ff]">{hoveredBar.quarter}</span>
            </div>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between gap-5 text-[#888888]">
                <span>REVENUE:</span>
                <span className="font-bold text-white tabular-nums">
                  ${hoveredBar.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between gap-5 text-[#888888]">
                <span>UNITS SOLD:</span>
                <span className="font-mono tabular-nums text-[#cccccc]">
                  {hoveredBar.units.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between gap-5 text-[#888888]">
                <span>QUARTER SHARE:</span>
                <span className="font-mono tabular-nums font-bold text-[#00ff66]">
                  {hoveredBar.pctOfQuarter.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-[#1e1e1e] flex flex-wrap items-center justify-between text-[11px] text-[#777777] font-mono gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[#ff8c00] font-bold">[TELEMETRY]:</span>
          <span>HOVER OVER ANY VECTOR COLUMN TO INSPECT REVENUE, VOLUME &amp; QUARTER WEIGHT.</span>
        </div>
        {analysis.hasQ2AndQ3 && (
          <div className="text-[#ffcc00] font-bold">
            [*] Q2 &amp; Q3 PIVOT WINDOW HIGHLIGHTED
          </div>
        )}
      </div>
    </div>
  );
};
