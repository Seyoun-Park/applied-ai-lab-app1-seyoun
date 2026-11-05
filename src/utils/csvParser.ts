import { SalesRecord, TextCleaningAudit } from '../types/sales';
import {
  cleanRegionText,
  cleanChannelText,
  cleanProductText,
  cleanQuarterText,
  TextCleaningTracker,
} from './textCleaner';

// Split CSV lines respecting quotes
export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        // Escaped quote
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Clean numeric strings: removes $, commas, spaces, %
export function parseNumeric(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$€£,\s]/g, '').replace(/%/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export interface ParseOptions {
  enableAutoClean?: boolean;
}

export interface ParseResult {
  records: SalesRecord[];
  errors: string[];
  totalLines: number;
  cleaningAudits: TextCleaningAudit[];
  totalCleanedModifications: number;
}

export function parseSalesCsv(csvText: string, options: ParseOptions = { enableAutoClean: true }): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const errors: string[] = [];
  if (lines.length < 2) {
    return {
      records: [],
      errors: ['CSV file is empty or missing data rows.'],
      totalLines: 0,
      cleaningAudits: [],
      totalCleanedModifications: 0,
    };
  }

  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

  // Header column index mapping
  const findCol = (aliases: string[]): number => {
    return rawHeaders.findIndex((h) => aliases.some((alias) => h === alias || h.includes(alias)));
  };

  const quarterIdx = findCol(['quarter', 'qtr', 'period']);
  const regionIdx = findCol(['region', 'territory', 'market', 'area']);
  const channelIdx = findCol(['channel', 'sales_channel', 'saleschannel']);
  const productIdx = findCol(['product', 'item', 'offering', 'sku']);
  const unitsIdx = findCol(['units', 'quantity', 'qty', 'volume']);
  const discountIdx = findCol(['discount_pct', 'discount', 'disc_pct', 'discount_percentage']);
  const revenueIdx = findCol(['revenue', 'sales', 'amount', 'net_sales', 'total_revenue']);

  const missing: string[] = [];
  if (quarterIdx === -1) missing.push('quarter');
  if (regionIdx === -1) missing.push('region');
  if (channelIdx === -1) missing.push('channel');
  if (productIdx === -1) missing.push('product');
  if (unitsIdx === -1) missing.push('units');
  if (discountIdx === -1) missing.push('discount_pct');
  if (revenueIdx === -1) missing.push('revenue');

  if (missing.length > 0) {
    errors.push(`Missing required column(s): ${missing.join(', ')}. Found: ${rawHeaders.join(', ')}`);
    return {
      records: [],
      errors,
      totalLines: lines.length,
      cleaningAudits: [],
      totalCleanedModifications: 0,
    };
  }

  const tracker = new TextCleaningTracker();
  const records: SalesRecord[] = [];
  const enableAutoClean = options.enableAutoClean ?? true;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 1 && row[0] === '') continue;

    const rawQuarter = row[quarterIdx] || '';
    const rawRegion = row[regionIdx] || '';
    const rawChannel = row[channelIdx] || '';
    const rawProduct = row[productIdx] || '';

    let quarter: string;
    let region: string;
    let channel: string;
    let product: string;

    if (enableAutoClean) {
      quarter = tracker.track('quarter', rawQuarter, cleanQuarterText(rawQuarter));
      region = tracker.track('region', rawRegion, cleanRegionText(rawRegion));
      channel = tracker.track('channel', rawChannel, cleanChannelText(rawChannel));
      product = tracker.track('product', rawProduct, cleanProductText(rawProduct));
    } else {
      quarter = rawQuarter.trim();
      region = rawRegion.trim();
      channel = rawChannel.trim() || 'Direct';
      product = rawProduct.trim() || 'Standard Product';
    }

    const units = Math.round(parseNumeric(row[unitsIdx] || '0'));
    let discount = parseNumeric(row[discountIdx] || '0');
    // If user provided 0.15 instead of 15, normalize to percentage (15)
    if (discount > 0 && discount <= 1) {
      discount = discount * 100;
    }
    const revenue = parseNumeric(row[revenueIdx] || '0');

    if (!quarter || !region) {
      errors.push(`Row ${i + 1}: Missing quarter or region value.`);
      continue;
    }

    records.push({
      id: `order-${i}-${Math.random().toString(36).substring(2, 7)}`,
      quarter,
      region,
      channel,
      product,
      units: Math.max(0, units),
      discount_pct: Math.max(0, discount),
      revenue: Math.max(0, revenue),
      rawQuarter,
      rawRegion,
      rawChannel,
      rawProduct,
    });
  }

  const cleaningAudits = tracker.getAudits();
  const totalCleanedModifications = cleaningAudits.reduce((acc, curr) => acc + curr.count, 0);

  return {
    records,
    errors,
    totalLines: lines.length - 1,
    cleaningAudits,
    totalCleanedModifications,
  };
}

// Sample dataset including real-world human error variations like "west" and "West", "emea" and "EMEA",
// extra whitespace " Direct Sales " so users can test auto-cleaning immediately!
export const SAMPLE_SALES_CSV = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Direct Sales,Cloud Enterprise,420,12,630000
Q1,North America,Partner,AI Analytics,310,15,465000
Q1,North America,Online,Security Suite,550,8,275000
Q1,West,Direct Sales,Cloud Enterprise,200,10,300000
Q1,west,Partner,Security Suite,150,15,75000
Q1,EMEA,Direct Sales,Cloud Enterprise,380,10,570000
Q1,EMEA,Partner,Hardware Edge,190,14,285000
Q1,APAC,Direct Sales,Cloud Enterprise,260,18,390000
Q1,APAC,Online,AI Analytics,410,10,615000
Q1,LATAM,Partner,Security Suite,200,20,100000
Q2,North America,Direct Sales,Cloud Enterprise,450,12,675000
Q2,North America,Partner,AI Analytics,340,14,510000
Q2,North America,Online,Security Suite,600,10,300000
Q2,North America,Direct Sales,Core ERP,120,5,360000
Q2,West,Direct Sales,Cloud Enterprise,220,10,330000
Q2,west,Online,AI Analytics,180,12,270000
Q2,EMEA,Direct Sales,Cloud Enterprise,400,10,600000
Q2,EMEA,Partner,Hardware Edge,220,15,330000
Q2,EMEA,Online,Security Suite,310,12,155000
Q2,APAC,Direct Sales,Cloud Enterprise,290,15,435000
Q2,APAC,Online,AI Analytics,430,8,645000
Q2,APAC,Partner,Core ERP,110,10,330000
Q2,LATAM,Direct Sales,Cloud Enterprise,150,18,225000
Q2,LATAM,Partner,Security Suite,240,20,120000
Q3,North America,Direct Sales,Cloud Enterprise,480,11,720000
Q3,North America,Partner,AI Analytics,360,12,540000
Q3,North America,Online,Security Suite,640,10,320000
Q3,North America,Direct Sales,Core ERP,130,5,390000
Q3,West,Direct Sales,Cloud Enterprise,310,8,465000
Q3,west,Online,AI Analytics,240,10,360000
Q3,EMEA,Direct Sales,Cloud Enterprise,780,8,1248000
Q3,EMEA,Direct Sales,AI Analytics,420,9,630000
Q3,EMEA,Partner,Hardware Edge,290,12,435000
Q3,EMEA,Online,Security Suite,390,10,195000
Q3,APAC,Direct Sales,Cloud Enterprise,310,14,465000
Q3,APAC,Online,AI Analytics,440,7,660000
Q3,APAC,Partner,Core ERP,95,12,285000
Q3,LATAM,Direct Sales,Cloud Enterprise,170,16,255000
Q3,LATAM,Partner,Security Suite,260,18,130000
Q4,North America,Direct Sales,Cloud Enterprise,520,10,780000
Q4,North America,Partner,AI Analytics,410,12,615000
Q4,North America,Online,Security Suite,700,9,350000
Q4,North America,Direct Sales,Core ERP,150,6,450000
Q4,West,Direct Sales,Cloud Enterprise,330,8,495000
Q4,west,Online,AI Analytics,250,10,375000
Q4,EMEA,Direct Sales,Cloud Enterprise,810,8,1296000
Q4,EMEA,Direct Sales,AI Analytics,450,8,675000
Q4,EMEA,Partner,Hardware Edge,300,10,450000
Q4,APAC,Direct Sales,Cloud Enterprise,330,12,495000
Q4,APAC,Online,AI Analytics,470,7,705000
Q4,LATAM,Direct Sales,Cloud Enterprise,190,15,285000
Q4,LATAM,Partner,Security Suite,280,18,140000`;
