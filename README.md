# David Writes

Personal fiction website for David Writes, built with Next.js App Router and designed for Vercel.

## Features

- Dark editorial library homepage
- Dynamic book and chapter routes
- Book-style reader with progress indicator and previous/next navigation
- Password-protected `/admin`
- Notion source saved in the browser
- Authenticated `/api/notion/sync` endpoint
- Current Notion API (`2026-03-11`) with page, data source, and database support
- No redirect is used by the sync flow, avoiding the previous `NEXT_REDIRECT` error

## Environment variables

Set these in Vercel:

- `ADMIN_PASSWORD` — private admin password
- `API_KEY` — Notion integration secret

Never commit the actual values to GitHub.

## Notion setup

Share the Notion page/database with your Notion integration, sign in to `/admin`, paste the Notion page/database URL or ID, save it, then press **Sync Notion**.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
