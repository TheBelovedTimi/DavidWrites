# Ghost Stories Society

A dark, elegant fiction platform for Doctor, built with Next.js App Router and designed for Vercel.

## Features

- Atmospheric story discovery homepage
- Dynamic story and chapter routes
- Comfortable reader with progress, appearance controls and chapter navigation
- Password-protected `/admin`
- Built-in story and chapter CMS
- Draft, Coming Soon, and Published states
- Persistent Neon/Postgres storage via `GSS_DATABASE_URL`
- Reading analytics, Continue Reading, search and genre filtering

## Environment variables

Set these in the Ghost Stories Society Vercel project:

- `ADMIN_PASSWORD` — private admin password
- `GSS_DATABASE_URL` — Ghost Stories Society Neon/Postgres connection URL

Never commit the actual values to GitHub.

## Publishing workflow

Use `/admin` to create and edit stories and chapters. Draft content stays private, Coming Soon stories can be announced publicly without exposing unpublished chapter bodies, and Published content is readable on the public site.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
