export interface SalesRecord {
  id: string;
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number;
  revenue: number;
  // Raw pre-cleaned values for auditing
  rawRegion?: string;
  rawChannel?: string;
  rawProduct?: string;
  rawQuarter?: string;
}

export interface TextCleaningAudit {
  column: 'region' | 'channel' | 'product' | 'quarter';
  original: string;
  cleaned: string;
  count: number;
}


export interface RegionQuarterMetric {
  revenue: number;
  units: number;
  ordersCount: number;
  avgDiscountPct: number;
}

export interface DriverBreakdown {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  dollarDelta: number;
  pctDelta: number;
}

export interface Q2Q3RegionAnalysis {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  dollarDelta: number;
  pctDelta: number;
  absoluteDollarDelta: number;
  absolutePctDelta: number;
  q2Units: number;
  q3Units: number;
  deltaUnits: number;
  unitsPctChange: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  deltaDiscountPctPoint: number;
  topProductDrivers: DriverBreakdown[];
  topChannelDrivers: DriverBreakdown[];
}

export interface SalesAnalysisResult {
  records: SalesRecord[];
  regions: string[];
  quarters: string[];
  // region -> quarter -> metrics
  matrix: Record<string, Record<string, RegionQuarterMetric>>;
  // quarter -> total revenue
  quarterTotals: Record<string, number>;
  // region -> total revenue
  regionTotals: Record<string, number>;
  grandTotalRevenue: number;
  grandTotalUnits: number;
  // Q2 vs Q3 specific analysis
  hasQ2AndQ3: boolean;
  q2q3AnalysisList: Q2Q3RegionAnalysis[];
  largestByDollar: Q2Q3RegionAnalysis | null;
  largestByPct: Q2Q3RegionAnalysis | null;
}

export interface AiSummaryResponse {
  summary: string;
  modelUsed?: string;
  calculatedContext: string;
  verifiedNumbers: {
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    dollarDelta: number;
    pctDelta: number;
    topProduct: DriverBreakdown | null;
    topChannel: DriverBreakdown | null;
    units: {
      q2Units: number;
      q3Units: number;
      deltaUnits: number;
      pctChange: number;
    };
    discount: {
      q2AvgDiscountPct: number;
      q3AvgDiscountPct: number;
      deltaDiscountPctPoint: number;
    };
  };
}
