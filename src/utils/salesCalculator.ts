import {
  SalesRecord,
  SalesAnalysisResult,
  RegionQuarterMetric,
  Q2Q3RegionAnalysis,
  DriverBreakdown,
} from '../types/sales';

const STANDARD_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function calculateSalesAnalysis(records: SalesRecord[]): SalesAnalysisResult {
  if (!records || records.length === 0) {
    return {
      records: [],
      regions: [],
      quarters: [],
      matrix: {},
      quarterTotals: {},
      regionTotals: {},
      grandTotalRevenue: 0,
      grandTotalUnits: 0,
      hasQ2AndQ3: false,
      q2q3AnalysisList: [],
      largestByDollar: null,
      largestByPct: null,
    };
  }

  const regionSet = new Set<string>();
  const quarterSet = new Set<string>();

  records.forEach((r) => {
    if (r.region) regionSet.add(r.region);
    if (r.quarter) quarterSet.add(r.quarter);
  });

  // Sort quarters logically (Q1, Q2, Q3, Q4 first, then others)
  const quarters = Array.from(quarterSet).sort((a, b) => {
    const idxA = STANDARD_QUARTERS.indexOf(a);
    const idxB = STANDARD_QUARTERS.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const regions = Array.from(regionSet).sort((a, b) => a.localeCompare(b));

  // Initialize matrix
  const matrix: Record<string, Record<string, RegionQuarterMetric>> = {};
  regions.forEach((region) => {
    matrix[region] = {};
    quarters.forEach((q) => {
      matrix[region][q] = {
        revenue: 0,
        units: 0,
        ordersCount: 0,
        avgDiscountPct: 0,
      };
    });
  });

  const quarterTotals: Record<string, number> = {};
  quarters.forEach((q) => (quarterTotals[q] = 0));

  const regionTotals: Record<string, number> = {};
  regions.forEach((r) => (regionTotals[r] = 0));

  let grandTotalRevenue = 0;
  let grandTotalUnits = 0;

  // Temporary accumulator for discount weighted averages
  const discountAccum: Record<string, Record<string, { totalDiscount: number; count: number }>> = {};

  records.forEach((r) => {
    const region = r.region;
    const quarter = r.quarter;
    if (!matrix[region] || !matrix[region][quarter]) return;

    matrix[region][quarter].revenue += r.revenue;
    matrix[region][quarter].units += r.units;
    matrix[region][quarter].ordersCount += 1;

    quarterTotals[quarter] = (quarterTotals[quarter] || 0) + r.revenue;
    regionTotals[region] = (regionTotals[region] || 0) + r.revenue;

    grandTotalRevenue += r.revenue;
    grandTotalUnits += r.units;

    if (!discountAccum[region]) discountAccum[region] = {};
    if (!discountAccum[region][quarter]) discountAccum[region][quarter] = { totalDiscount: 0, count: 0 };
    discountAccum[region][quarter].totalDiscount += r.discount_pct;
    discountAccum[region][quarter].count += 1;
  });

  // Calculate average discount percentage for each region & quarter
  regions.forEach((region) => {
    quarters.forEach((q) => {
      const acc = discountAccum[region]?.[q];
      if (acc && acc.count > 0) {
        matrix[region][q].avgDiscountPct = acc.totalDiscount / acc.count;
      }
    });
  });

  // Check if both Q2 and Q3 exist in dataset
  const hasQ2 = quarters.includes('Q2');
  const hasQ3 = quarters.includes('Q3');
  const hasQ2AndQ3 = hasQ2 && hasQ3;

  const q2q3AnalysisList: Q2Q3RegionAnalysis[] = [];

  if (hasQ2AndQ3) {
    regions.forEach((region) => {
      const q2Data = matrix[region]['Q2'] || { revenue: 0, units: 0, avgDiscountPct: 0, ordersCount: 0 };
      const q3Data = matrix[region]['Q3'] || { revenue: 0, units: 0, avgDiscountPct: 0, ordersCount: 0 };

      const q2Revenue = q2Data.revenue;
      const q3Revenue = q3Data.revenue;
      const dollarDelta = q3Revenue - q2Revenue;
      const pctDelta = q2Revenue > 0 ? ((q3Revenue - q2Revenue) / q2Revenue) * 100 : q3Revenue > 0 ? 100 : 0;
      const absoluteDollarDelta = Math.abs(dollarDelta);
      const absolutePctDelta = Math.abs(pctDelta);

      const q2Units = q2Data.units;
      const q3Units = q3Data.units;
      const deltaUnits = q3Units - q2Units;
      const unitsPctChange = q2Units > 0 ? ((q3Units - q2Units) / q2Units) * 100 : 0;

      const q2AvgDiscountPct = q2Data.avgDiscountPct;
      const q3AvgDiscountPct = q3Data.avgDiscountPct;
      const deltaDiscountPctPoint = q3AvgDiscountPct - q2AvgDiscountPct;

      // Calculate Product Drivers for this region between Q2 and Q3
      const productMap: Record<string, { q2: number; q3: number }> = {};
      const channelMap: Record<string, { q2: number; q3: number }> = {};

      records
        .filter((r) => r.region === region && (r.quarter === 'Q2' || r.quarter === 'Q3'))
        .forEach((r) => {
          if (!productMap[r.product]) productMap[r.product] = { q2: 0, q3: 0 };
          if (!channelMap[r.channel]) channelMap[r.channel] = { q2: 0, q3: 0 };

          if (r.quarter === 'Q2') {
            productMap[r.product].q2 += r.revenue;
            channelMap[r.channel].q2 += r.revenue;
          } else if (r.quarter === 'Q3') {
            productMap[r.product].q3 += r.revenue;
            channelMap[r.channel].q3 += r.revenue;
          }
        });

      const topProductDrivers: DriverBreakdown[] = Object.entries(productMap)
        .map(([name, vals]) => {
          const delta = vals.q3 - vals.q2;
          const pct = vals.q2 > 0 ? ((vals.q3 - vals.q2) / vals.q2) * 100 : vals.q3 > 0 ? 100 : 0;
          return {
            name,
            q2Revenue: vals.q2,
            q3Revenue: vals.q3,
            dollarDelta: delta,
            pctDelta: pct,
          };
        })
        .sort((a, b) => Math.abs(b.dollarDelta) - Math.abs(a.dollarDelta));

      const topChannelDrivers: DriverBreakdown[] = Object.entries(channelMap)
        .map(([name, vals]) => {
          const delta = vals.q3 - vals.q2;
          const pct = vals.q2 > 0 ? ((vals.q3 - vals.q2) / vals.q2) * 100 : vals.q3 > 0 ? 100 : 0;
          return {
            name,
            q2Revenue: vals.q2,
            q3Revenue: vals.q3,
            dollarDelta: delta,
            pctDelta: pct,
          };
        })
        .sort((a, b) => Math.abs(b.dollarDelta) - Math.abs(a.dollarDelta));

      q2q3AnalysisList.push({
        region,
        q2Revenue,
        q3Revenue,
        dollarDelta,
        pctDelta,
        absoluteDollarDelta,
        absolutePctDelta,
        q2Units,
        q3Units,
        deltaUnits,
        unitsPctChange,
        q2AvgDiscountPct,
        q3AvgDiscountPct,
        deltaDiscountPctPoint,
        topProductDrivers,
        topChannelDrivers,
      });
    });
  }

  // Determine which region changed the most
  let largestByDollar: Q2Q3RegionAnalysis | null = null;
  let largestByPct: Q2Q3RegionAnalysis | null = null;

  if (q2q3AnalysisList.length > 0) {
    const sortedByDollar = [...q2q3AnalysisList].sort((a, b) => b.absoluteDollarDelta - a.absoluteDollarDelta);
    largestByDollar = sortedByDollar[0];

    const sortedByPct = [...q2q3AnalysisList].sort((a, b) => b.absolutePctDelta - a.absolutePctDelta);
    largestByPct = sortedByPct[0];
  }

  return {
    records,
    regions,
    quarters,
    matrix,
    quarterTotals,
    regionTotals,
    grandTotalRevenue,
    grandTotalUnits,
    hasQ2AndQ3,
    q2q3AnalysisList,
    largestByDollar,
    largestByPct,
  };
}
