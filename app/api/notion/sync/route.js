import { NextResponse } from 'next/server';
import { isAdmin } from '../../../lib/auth';

const NOTION_VERSION = '2026-03-11';

function normalizeId(source = '') {
  const clean = source.trim();
  const undashed = clean.match(/[0-9a-fA-F]{32}/g)?.pop();
  if (undashed) {
    const x = undashed.toLowerCase();
    return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
  }
  return clean.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)?.[0] || clean;
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

async function getPage(id, token) {
  const { response, body } = await notionFetch(`/pages/${id}`, token);
  return response.ok ? hydratePage(body, token) : null;
}

async function queryDataSource(dataSourceId, token) {
  const meta = await notionFetch(`/data_sources/${dataSourceId}`, token);
  if (!meta.response.ok) return null;
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
  return { id: meta.body.id, title: meta.body.name || 'Notion data source', pages };
}

async function getDatabase(databaseId, token) {
  const meta = await notionFetch(`/databases/${databaseId}`, token);
  if (!meta.response.ok) return null;
  const sources = meta.body.data_sources || [];
  const pages = [];
  for (const source of sources) {
    const result = await queryDataSource(source.id, token);
    if (result) pages.push(...result.pages);
  }
  const databaseTitle = richText(meta.body?.title) || 'Notion database';
  return { id: meta.body.id, title: databaseTitle, pages, dataSources: sources.map((s) => ({ id: s.id, name: s.name })) };
}

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const token = process.env.API_KEY;
  if (!token) return NextResponse.json({ ok: false, error: 'API_KEY is not configured in Vercel.' }, { status: 500 });

  try {
    const { source } = await request.json();
    if (!source?.trim()) return NextResponse.json({ ok: false, error: 'Paste a Notion page/database URL or ID first.' }, { status: 400 });
    const id = normalizeId(source);

    const page = await getPage(id, token);
    if (page) return NextResponse.json({ ok: true, kind: 'page', sourceId: id, page });

    const dataSource = await queryDataSource(id, token);
    if (dataSource) return NextResponse.json({ ok: true, kind: 'database', sourceId: id, database: dataSource });

    const database = await getDatabase(id, token);
    if (database) return NextResponse.json({ ok: true, kind: 'database', sourceId: id, database });

    return NextResponse.json({
      ok: false,
      error: 'Notion could not access that source. Check the URL/ID and make sure the page or database is shared with your integration.'
    }, { status: 404 });
  } catch (error) {
    console.error('Notion sync error', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Notion sync failed.' }, { status: 500 });
  }
}
