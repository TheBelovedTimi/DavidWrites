import { NextResponse } from 'next/server';
import { isAdmin } from '../../../lib/auth';

const NOTION_VERSION = '2026-03-11';

function dashId(value = '') {
  const x = value.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(x)) return null;
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
}

function normalizeId(source = '') {
  const clean = source.trim();

  // For Notion URLs, only inspect the pathname. Query params such as ?v=...
  // are view IDs and must never be mistaken for the database/page ID.
  try {
    const url = new URL(clean);
    const pathname = decodeURIComponent(url.pathname);
    const undashed = pathname.match(/[0-9a-fA-F]{32}/g)?.pop();
    if (undashed) return dashId(undashed);
    const dashed = pathname.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g)?.pop();
    if (dashed) return dashId(dashed);
  } catch {
    // Raw IDs are handled below.
  }

  const undashed = clean.match(/^[0-9a-fA-F]{32}$/)?.[0];
  if (undashed) return dashId(undashed);
  const dashed = clean.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)?.[0];
  if (dashed) return dashId(dashed);
  return null;
}

function richText(items = []) {
  return items.map((item) => item.plain_text || item.text?.content || '').join('');
}

function titleFromPage(page) {
  for (const value of Object.values(page?.properties || {})) {
    if (value?.type === 'title') return richText(value.title) || 'Untitled';
  }
  return 'Untitled';
}

function mapBlock(block) {
  const data = block?.[block.type] || {};
  const mapped = { id: block.id, type: block.type };
  if (data.rich_text) mapped.text = richText(data.rich_text);
  if (block.type === 'image') {
    mapped.url = data.type === 'external' ? data.external?.url : data.file?.url;
    mapped.caption = richText(data.caption);
  }
  if (block.type === 'divider') mapped.text = '';
  return mapped;
}

async function notionFetch(path, token, init = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function getChildren(blockId, token) {
  let cursor = null;
  const blocks = [];
  do {
    const params = new URLSearchParams({ page_size: '100' });
    if (cursor) params.set('start_cursor', cursor);
    const { response, body } = await notionFetch(`/blocks/${blockId}/children?${params}`, token);
    if (!response.ok) throw new Error(body?.message || `Unable to read Notion blocks (${response.status})`);
    for (const block of body.results || []) {
      const mapped = mapBlock(block);
      if (block.has_children) mapped.children = await getChildren(block.id, token);
      blocks.push(mapped);
    }
    cursor = body.has_more ? body.next_cursor : null;
  } while (cursor);
  return blocks;
}

async function hydratePage(page, token) {
  return {
    id: page.id,
    title: titleFromPage(page),
    url: page.url,
    blocks: await getChildren(page.id, token)
  };
}

async function tryPage(id, token) {
  const result = await notionFetch(`/pages/${id}`, token);
  if (result.response.ok) return { ok: true, value: await hydratePage(result.body, token) };
  return { ok: false, status: result.response.status, message: result.body?.message || 'Page lookup failed' };
}

async function queryDataSource(dataSourceId, token) {
  const meta = await notionFetch(`/data_sources/${dataSourceId}`, token);
  if (!meta.response.ok) return { ok: false, status: meta.response.status, message: meta.body?.message || 'Data source lookup failed' };
  let cursor = null;
  const pages = [];
  do {
    const payload = { page_size: 50, result_type: 'page' };
    if (cursor) payload.start_cursor = cursor;
    const query = await notionFetch(`/data_sources/${dataSourceId}/query`, token, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!query.response.ok) throw new Error(query.body?.message || `Unable to query Notion data source (${query.response.status})`);
    for (const page of query.body.results || []) {
      if (page.object === 'page') pages.push(await hydratePage(page, token));
    }
    cursor = query.body.has_more ? query.body.next_cursor : null;
  } while (cursor && pages.length < 100);
  return { ok: true, value: { id: meta.body.id, title: meta.body.name || 'Notion data source', pages } };
}

async function tryDatabase(databaseId, token) {
  const meta = await notionFetch(`/databases/${databaseId}`, token);
  if (!meta.response.ok) return { ok: false, status: meta.response.status, message: meta.body?.message || 'Database lookup failed' };
  const sources = meta.body.data_sources || [];
  const pages = [];
  for (const source of sources) {
    const result = await queryDataSource(source.id, token);
    if (result.ok) pages.push(...result.value.pages);
  }
  const databaseTitle = richText(meta.body?.title) || 'Notion database';
  return {
    ok: true,
    value: {
      id: meta.body.id,
      title: databaseTitle,
      pages,
      dataSources: sources.map((s) => ({ id: s.id, name: s.name }))
    }
  };
}

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const token = process.env.API_KEY;
  if (!token) return NextResponse.json({ ok: false, error: 'API_KEY is not configured in Vercel.' }, { status: 500 });

  try {
    const { source } = await request.json();
    if (!source?.trim()) return NextResponse.json({ ok: false, error: 'Paste a Notion page/database URL or ID first.' }, { status: 400 });

    const id = normalizeId(source);
    if (!id) {
      return NextResponse.json({
        ok: false,
        error: 'I could not find a valid Notion page/database ID in that value. Paste the full Notion page/database URL or a 32-character Notion ID.'
      }, { status: 400 });
    }

    const page = await tryPage(id, token);
    if (page.ok) return NextResponse.json({ ok: true, kind: 'page', sourceId: id, page: page.value });

    const dataSource = await queryDataSource(id, token);
    if (dataSource.ok) return NextResponse.json({ ok: true, kind: 'database', sourceId: id, database: dataSource.value });

    const database = await tryDatabase(id, token);
    if (database.ok) return NextResponse.json({ ok: true, kind: 'database', sourceId: id, database: database.value });

    const statuses = [page.status, dataSource.status, database.status].filter(Boolean);
    const messages = [page.message, dataSource.message, database.message].filter(Boolean);
    const permissionLike = statuses.some((status) => status === 401 || status === 403 || status === 404);

    return NextResponse.json({
      ok: false,
      sourceId: id,
      error: permissionLike
        ? `Notion rejected this source (${[...new Set(statuses)].join('/')}). The ID parsed from your link is ${id}. Make sure the original page/database — not just a linked view — is shared with the same Notion integration whose token is stored in API_KEY.`
        : `Notion could not read this source. ${messages[0] || 'Unknown Notion API error.'}`,
      debug: { statuses, messages }
    }, { status: 404 });
  } catch (error) {
    console.error('Notion sync error', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Notion sync failed.' }, { status: 500 });
  }
}
