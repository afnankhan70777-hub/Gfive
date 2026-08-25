# G'FIVE Pakistan - ERP System

Complete IMEI + Inventory + Ledger ERP system for G'FIVE Pakistan.

## Tech Stack

- **Framework**: Next.js 16 (static export)
- **Language**: TypeScript + React 19
- **Styling**: Tailwind CSS v4
- **State**: Zustand + Immer
- **Backend**: Supabase (auth + database)
- **Charts**: Recharts
- **Animations**: Framer Motion

## Features

- Dashboard with analytics
- IMEI management (single + batch)
- Parts inventory
- Party ledger
- Production tracking
- Repair management
- Sales
- Returns
- Reports
- Users and permissions
- Audit logs
- Settings

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 with your browser.

## Build

```bash
npm run build
```

Static export is generated in `dist8/`.

## Deployment

This project is deployed via GitHub Pages using GitHub Actions.
On push to `main`, the workflow builds the project and deploys automatically.

**Live URL**: https://afnankhan70777-hub.github.io/Gfive/
