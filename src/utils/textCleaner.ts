import { TextCleaningAudit } from '../types/sales';

// Known uppercase acronyms to preserve across text fields
const ACRONYMS: Record<string, string> = {
  emea: 'EMEA',
  apac: 'APAC',
  latam: 'LATAM',
  na: 'NA',
  us: 'USA',
  usa: 'USA',
  eu: 'EU',
  uk: 'UK',
  anz: 'ANZ',
  ai: 'AI',
  erp: 'ERP',
  crm: 'CRM',
  saas: 'SaaS',
  ml: 'ML',
  api: 'API',
  iot: 'IoT',
  b2b: 'B2B',
  b2c: 'B2C',
  oem: 'OEM',
};

// Common geographic aliases & corrections
const REGION_ALIASES: Record<string, string> = {
  west: 'West',
  east: 'East',
  north: 'North',
  south: 'South',
  central: 'Central',
  midwest: 'Midwest',
  'mid-west': 'Midwest',
  'north america': 'North America',
  'north-america': 'North America',
  'south america': 'South America',
  'south-america': 'South America',
  'latin america': 'Latin America',
  'latin-america': 'Latin America',
  'asia pacific': 'APAC',
  'asia-pacific': 'APAC',
  northeast: 'Northeast',
  'north east': 'Northeast',
  'north-east': 'Northeast',
  northwest: 'Northwest',
  'north west': 'Northwest',
  'north-west': 'Northwest',
  southeast: 'Southeast',
  'south east': 'Southeast',
  'south-east': 'Southeast',
  southwest: 'Southwest',
  'south west': 'Southwest',
  'south-west': 'Southwest',
};

/**
 * Basic text sanitizer:
 * - Normalizes unicode
 * - Replaces non-breaking spaces
 * - Trims whitespace
 * - Collapses consecutive spaces
 * - Strips accidental surrounding quotes / brackets
 * - Strips accidental trailing commas or periods
 */
export function sanitizeRawText(input: string): string {
  if (!input) return '';

  let str = input
    .normalize('NFKD')
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ') // non-breaking spaces
    .trim();

  // Strip leading/trailing surrounding quotes or brackets (e.g. "'West'", " West, ")
  str = str.replace(/^["'`([{]+|["'`)\]}]+$/g, '').trim();

  // Remove trailing punctuation accidentally left in CSV cells (e.g. "West,", "West.")
  str = str.replace(/[,;.]+$/, '').trim();

  // Collapse multiple whitespaces
  str = str.replace(/\s+/g, ' ');

  return str;
}

/**
 * Capitalizes text to Proper Title Case while respecting known acronyms
 */
export function toTitleCaseWithAcronyms(input: string): string {
  const words = input.split(/[\s_]+/);

  return words
    .map((word) => {
      const lower = word.toLowerCase();
      // Check known acronyms
      if (ACRONYMS[lower]) {
        return ACRONYMS[lower];
      }
      // Check hyphenated words (e.g. "South-West")
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            const pLower = part.toLowerCase();
            if (ACRONYMS[pLower]) return ACRONYMS[pLower];
            if (!part) return '';
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }

      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Clean and harmonize Region names:
 * Fixes "West" vs "west" vs " WEST ", "emea" vs "EMEA", "north-america" vs "North America"
 */
export function cleanRegionText(raw: string): string {
  const sanitized = sanitizeRawText(raw);
  if (!sanitized) return 'Unknown Region';

  const lower = sanitized.toLowerCase();

  // Direct alias match (e.g. "west" -> "West", "asia-pacific" -> "APAC")
  if (REGION_ALIASES[lower]) {
    return REGION_ALIASES[lower];
  }

  // Acronym match (e.g. "emea" -> "EMEA")
  if (ACRONYMS[lower]) {
    return ACRONYMS[lower];
  }

  // General Title Case conversion
  return toTitleCaseWithAcronyms(sanitized);
}

/**
 * Clean and harmonize Channel names:
 * e.g. "direct sales", "Direct_Sales", "direct-sales", "partner ", "online"
 */
export function cleanChannelText(raw: string): string {
  const sanitized = sanitizeRawText(raw);
  if (!sanitized) return 'Direct';

  const lower = sanitized.toLowerCase();
  if (ACRONYMS[lower]) {
    return ACRONYMS[lower];
  }

  // Standardize common separators
  const separated = sanitized.replace(/[_]+/g, ' ');
  return toTitleCaseWithAcronyms(separated);
}

/**
 * Clean and harmonize Product names:
 * e.g. "cloud enterprise", "ai analytics", "core erp", "security-suite"
 */
export function cleanProductText(raw: string): string {
  const sanitized = sanitizeRawText(raw);
  if (!sanitized) return 'Standard Product';

  const lower = sanitized.toLowerCase();
  if (ACRONYMS[lower]) {
    return ACRONYMS[lower];
  }

  const separated = sanitized.replace(/[_]+/g, ' ');
  return toTitleCaseWithAcronyms(separated);
}

/**
 * Clean and harmonize Quarter strings:
 * e.g. "q2", "quarter 2", "qtr 2", "2024-q2", "2Q", "2nd quarter" -> "Q2"
 */
export function cleanQuarterText(raw: string): string {
  const sanitized = sanitizeRawText(raw);
  if (!sanitized) return 'Q1';

  // Check Q1-Q4 patterns
  const match =
    sanitized.match(/q(?:uarter|tr)?\s*([1-4])/i) ||
    sanitized.match(/([1-4])\s*(?:st|nd|rd|th)?\s*q(?:uarter)?/i) ||
    sanitized.match(/([1-4])q/i);

  if (match) {
    return `Q${match[1]}`;
  }

  return sanitized.toUpperCase();
}

/**
 * Accumulator helper to track human error corrections
 */
export class TextCleaningTracker {
  private auditMap = new Map<string, TextCleaningAudit>();

  public track(
    column: 'region' | 'channel' | 'product' | 'quarter',
    original: string,
    cleaned: string
  ): string {
    // If there is any difference between original and cleaned
    if (original !== cleaned) {
      const key = `${column}::${original}::${cleaned}`;
      const existing = this.auditMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        this.auditMap.set(key, {
          column,
          original,
          cleaned,
          count: 1,
        });
      }
    }
    return cleaned;
  }

  public getAudits(): TextCleaningAudit[] {
    return Array.from(this.auditMap.values()).sort((a, b) => b.count - a.count);
  }
}
