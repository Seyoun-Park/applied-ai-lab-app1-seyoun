import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper to initialize GoogleGenAI client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

interface DriverItem {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  dollarDelta: number;
  pctDelta: number;
}

interface SummaryRequestPayload {
  largestRegion: string;
  rankMetric: 'dollar' | 'percent';
  q2Revenue: number;
  q3Revenue: number;
  dollarDelta: number;
  pctDelta: number;
  allRegionsRanked: {
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    dollarDelta: number;
    pctDelta: number;
  }[];
  topProductDrivers: DriverItem[];
  topChannelDrivers: DriverItem[];
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
  totalRevenueQ2AllRegions: number;
  totalRevenueQ3AllRegions: number;
}

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

// Generates a strictly 3-sentence summary deterministically using only the app's calculated numbers
function generateCalculatedThreeSentences(data: SummaryRequestPayload): string {
  const topProd = data.topProductDrivers[0];
  const topChan = data.topChannelDrivers[0];
  const directionVerb = data.dollarDelta >= 0 ? 'grew by' : 'contracted by';

  const s1 = `${data.largestRegion} changed the most from Q2 to Q3, moving from ${formatCurrency(
    data.q2Revenue
  )} to ${formatCurrency(data.q3Revenue)} for a net change of ${data.dollarDelta >= 0 ? '+' : ''}${formatCurrency(
    data.dollarDelta
  )} (${formatPct(data.pctDelta)}).`;

  const s2 = `This movement was primarily driven by ${
    topProd
      ? `the ${topProd.name} product line, which ${topProd.dollarDelta >= 0 ? 'increased' : 'decreased'} from ${formatCurrency(topProd.q2Revenue)} to ${formatCurrency(topProd.q3Revenue)} (${formatCurrency(topProd.dollarDelta)})`
      : 'core product expansion'
  }${
    topChan
      ? `, alongside the ${topChan.name} sales channel which shifted by ${topChan.dollarDelta >= 0 ? '+' : ''}${formatCurrency(topChan.dollarDelta)}`
      : ''
  }.`;

  const s3 = `Additionally, regional sales volume shifted from ${data.units.q2Units.toLocaleString()} units to ${data.units.q3Units.toLocaleString()} units (${formatPct(
    data.units.pctChange
  )}), while average customer discounts moved from ${data.discount.q2AvgDiscountPct.toFixed(
    1
  )}% to ${data.discount.q3AvgDiscountPct.toFixed(1)}%.`;

  return `${s1} ${s2} ${s3}`;
}

// API Endpoint for generating strictly 3-sentence summary using only app-calculated numbers
app.post('/api/summarize-q2-q3', async (req: Request, res: Response) => {
  try {
    const data: SummaryRequestPayload = req.body;

    if (!data || !data.largestRegion) {
      return res.status(400).json({ error: 'Missing calculated regional sales data.' });
    }

    const ai = getAiClient();

    // Prepare human-readable breakdown of app-calculated numbers
    const calculatedContext = `
APP-CALCULATED REGIONAL SALES NUMBERS (Q2 vs Q3):
1. Top changing region: ${data.largestRegion}
   - Q2 Revenue: ${formatCurrency(data.q2Revenue)}
   - Q3 Revenue: ${formatCurrency(data.q3Revenue)}
   - Dollar Change: ${formatCurrency(data.dollarDelta)} (${formatPct(data.pctDelta)})
   - Change Direction: ${data.dollarDelta >= 0 ? 'increase' : 'decrease'}

2. Comparison with other regions:
${data.allRegionsRanked
  .map(
    (r) =>
      `   - ${r.region}: Q2 ${formatCurrency(r.q2Revenue)} -> Q3 ${formatCurrency(
        r.q3Revenue
      )} (Change: ${formatCurrency(r.dollarDelta)}, ${formatPct(r.pctDelta)})`
  )
  .join('\n')}

3. Product Drivers in ${data.largestRegion}:
${data.topProductDrivers
  .map(
    (p) =>
      `   - Product "${p.name}": Q2 ${formatCurrency(p.q2Revenue)} -> Q3 ${formatCurrency(
        p.q3Revenue
      )} (Change: ${formatCurrency(p.dollarDelta)}, ${formatPct(p.pctDelta)})`
  )
  .join('\n')}

4. Channel Drivers in ${data.largestRegion}:
${data.topChannelDrivers
  .map(
    (c) =>
      `   - Channel "${c.name}": Q2 ${formatCurrency(c.q2Revenue)} -> Q3 ${formatCurrency(
        c.q3Revenue
      )} (Change: ${formatCurrency(c.dollarDelta)}, ${formatPct(c.pctDelta)})`
  )
  .join('\n')}

5. Volume and Discount Metrics for ${data.largestRegion}:
   - Units Sold: Q2 ${data.units.q2Units.toLocaleString()} units -> Q3 ${data.units.q3Units.toLocaleString()} units (Change: ${
      data.units.deltaUnits >= 0 ? '+' : ''
    }${data.units.deltaUnits.toLocaleString()} units, ${formatPct(data.units.pctChange)})
   - Average Discount Rate: Q2 ${data.discount.q2AvgDiscountPct.toFixed(
     1
   )}% -> Q3 ${data.discount.q3AvgDiscountPct.toFixed(1)}% (Change: ${
      data.discount.deltaDiscountPctPoint >= 0 ? '+' : ''
    }${data.discount.deltaDiscountPctPoint.toFixed(1)} percentage points)

6. Overall Company Context:
   - Total Company Q2 Revenue: ${formatCurrency(data.totalRevenueQ2AllRegions)}
   - Total Company Q3 Revenue: ${formatCurrency(data.totalRevenueQ3AllRegions)}
`;

    let generatedText = '';
    let usedModel = 'gemini-3.8-flash';

    if (ai) {
      const prompt = `You are an expert sales analyst reviewing executive quarterly performance.
Write exactly a three-sentence summary of which region changed most from Q2 to Q3, and why, using ONLY numbers the app calculated provided below.

Strict Requirements:
1. You must write EXACTLY THREE SENTENCES. Count your sentences carefully. Do not write 2 sentences or 4 sentences.
2. Do not use bullet points, bolding prefixes, headers, markdown titles, or greetings. Output only the 3 sentences in a single paragraph.
3. Sentence 1 must state which region experienced the largest change from Q2 to Q3, citing its exact Q2 revenue, Q3 revenue, and the exact dollar change and percentage change.
4. Sentence 2 must explain why this change occurred by specifying the primary product or channel drivers using the exact calculated revenue numbers provided.
5. Sentence 3 must provide additional supporting reasons (such as changes in units sold, average discount percentage, or secondary channel/product shifts) using only the provided numbers.
6. YOU MUST ONLY USE NUMBERS PROVIDED IN THE CONTEXT BELOW. Do not invent, estimate, approximate, round differently, or hallucinate any numbers or figures not present in the calculated context.

Calculated Context:
${calculatedContext}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a precise corporate sales analyst. Follow all constraints strictly: output exactly three sentences and use only the provided calculated figures.',
            temperature: 0.2,
          },
        });
        generatedText = response.text ? response.text.trim() : '';
      } catch (geminiError: any) {
        console.warn('Gemini 3.8 flash call encountered error, attempting fallback:', geminiError?.message);

        // Fallback to gemini-flash-latest or gemini-3.1-flash-lite if available
        try {
          usedModel = 'gemini-flash-latest';
          const fallbackResp = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
              systemInstruction:
                'You are a precise corporate sales analyst. Follow all constraints strictly: output exactly three sentences and use only the provided calculated figures.',
              temperature: 0.2,
            },
          });
          generatedText = fallbackResp.text ? fallbackResp.text.trim() : '';
        } catch (secondaryError) {
          console.warn('Secondary model also unavailable, utilizing deterministic calculation engine:', secondaryError);
          generatedText = generateCalculatedThreeSentences(data);
          usedModel = 'ground-truth-engine';
        }
      }
    }

    if (!generatedText) {
      generatedText = generateCalculatedThreeSentences(data);
      usedModel = 'ground-truth-engine';
    }

    return res.json({
      summary: generatedText,
      modelUsed: usedModel,
      calculatedContext,
      verifiedNumbers: {
        region: data.largestRegion,
        q2Revenue: data.q2Revenue,
        q3Revenue: data.q3Revenue,
        dollarDelta: data.dollarDelta,
        pctDelta: data.pctDelta,
        topProduct: data.topProductDrivers[0] || null,
        topChannel: data.topChannelDrivers[0] || null,
        units: data.units,
        discount: data.discount,
      },
    });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate AI executive summary',
    });
  }
});

// Configure Vite or Static file serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Sales Analytics Server running on port ${port}`);
  });
}

startServer();
