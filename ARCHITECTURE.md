# Application Architecture & Overview

The Quarterly Regional Sales Analytics & Insights application is an enterprise executive dashboard designed to help sales leaders and finance teams evaluate revenue performance, regional trends, and quarter-over-quarter momentum. Users can upload raw sales order CSV files—or explore preloaded enterprise data—with built-in automated data cleaning that normalizes regional naming discrepancies, channel classifications, and product labels. The platform calculates key financial metrics, generates interactive grouped and stacked quarterly comparison charts, and provides granular breakdown tables with sortable variance analysis. To support executive reporting, the system incorporates an AI-driven summary engine powered by Google Gemini that generates a verified, strictly three-sentence executive brief explaining the largest regional shift from Q2 to Q3 alongside underlying product, channel, volume, and discount drivers grounded entirely in mathematical calculations.

## File Inventory & Responsibilities

| File Path | Description |
| :--- | :--- |
| `.env.example` | Provides a template of required environment variables, specifically the Google Gemini API key for server-side AI summary generation. |
| `.gitignore` | Specifies files and directories that Git version control should ignore, such as local packages, build output, and environment secrets. |
| `bun.lock` | Records exact package dependency versions locked from previous installations or upstream repository management. |
| `index.html` | Serves as the web application entry point that loads the React application and sets up page title, description, and social preview metadata. |
| `metadata.json` | Stores platform-level configuration including the application name, description, and major capability permissions. |
| `package.json` | Defines project metadata, automated scripts for dev and build pipelines, and all third-party software dependencies. |
| `server.ts` | Runs the Express backend server that serves the web application and exposes the secure API endpoint for generating verified Q2-to-Q3 executive summaries. |
| `src/App.tsx` | Serves as the master dashboard coordinator, managing application state, data flow, cleaning preferences, and layout presentation. |
| `src/components/AiSummaryCard.tsx` | Renders the executive AI insights panel, presenting a verified three-sentence narrative of Q2-to-Q3 performance changes alongside underlying driver metrics. |
| `src/components/ChartSection.tsx` | Provides interactive visual charts comparing quarterly revenue across regions in grouped, stacked, or region-focused views. |
| `src/components/KpiMetrics.tsx` | Displays high-level executive cards summarizing total company revenue, unit volume, top-performing region, and the largest quarter-over-quarter mover. |
| `src/components/TableSection.tsx` | Presents a sortable, downloadable financial matrix displaying quarterly regional revenue and quarter-over-quarter variance breakdowns. |
| `src/components/UploadSection.tsx` | Offers an interface for uploading custom CSV files, inspecting raw records, toggling data cleaning rules, and viewing data hygiene audits. |
| `src/index.css` | Imports global Tailwind CSS utility styles that govern the visual design, typography, and responsive layout of the dashboard. |
| `src/main.tsx` | Initializes and mounts the root React component tree into the web browser's Document Object Model (DOM). |
| `src/types/sales.ts` | Houses TypeScript data models and type definitions for sales records, calculations, quarterly analyses, and summary payloads. |
| `src/utils/csvParser.ts` | Converts raw CSV text into validated sales order records and embeds realistic sample enterprise sales data for immediate demonstration. |
| `src/utils/salesCalculator.ts` | Computes core business mathematics, including regional aggregations, quarterly revenue matrices, percentage changes, and top product/channel drivers. |
| `src/utils/textCleaner.ts` | Normalizes and sanitizes text inputs by standardizing regional names, fixing casing, resolving industry acronyms, and recording cleaning audit logs. |
| `tsconfig.json` | Configures TypeScript compiler settings, path aliases, and syntax validation rules to ensure type safety. |
| `vite.config.ts` | Configures the Vite build tool and development server, integrating React, Tailwind CSS, and path alias routing. |
