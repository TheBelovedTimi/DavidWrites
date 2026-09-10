# David Writes

Personal fiction website for David Writes, built with Next.js App Router and designed for Vercel.

## Features

- Dark editorial library homepage
- Dynamic book and chapter routes
- Book-style reader with progress indicator and previous/next navigation
- Password-protected `/admin`
- Built-in book and chapter CMS
- Draft, Coming Soon, and Published states
- Persistent Neon/Postgres storage via `DATABASE_URL`
- Optional Notion import/sync support
- Current Notion API (`2026-03-11`)

## Environment variables

Set these in Vercel:

- `ADMIN_PASSWORD` — private admin password
- `DATABASE_URL` — Neon/Postgres connection URL
- `API_KEY` — optional Notion integration secret

Never commit the actual values to GitHub.

## Publishing workflow

Use `/admin` to create and edit books and chapters. Draft content stays private, Coming Soon content can be announced publicly without exposing the chapter body, and Published content is readable on the public site.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
