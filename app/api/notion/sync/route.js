import { NextResponse } from 'next/server';
import { isAdmin } from '../../../lib/auth';

const NOTION_VERSION = '2022-06-28';

function normalizeId(source = '') {
  const clean = source.trim();
  const match = clean.match(/[0-9a-fA-F]{32}/g)?.pop();
  if (match) {
    const x = match.toLowerCase();
    return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
  }
  const dashed = clean.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)?.[0];
  return dashed || clean;
}

function richText(items = []) {
  return items.map((item) => item.plain_text || item.text?.content || '').join('');
}

function titleFromPage(page) {
  const props = page?.properties || {};
  for (const value of Object.values(props)) {
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
  let cursor;
  const blocks = [];
  do {
    const suffix = cursor ? `?page_size=100&start_cursor=${encodeURIComponent(cursor)}` : '?page_size=100';
    const { response, body } = await notionFetch(`/blocks/${blockId}/children${suffix}`, token);
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

async function getPage(pageId, token) {
  const { response, body } = await notionFetch(`/pages/${pageId}`, token);
  if (!response.ok) return null;
  return {
    id: body.id,
    title: titleFromPage(body),
    url: body.url,
    blocks: await getChildren(body.id, token)
  };
}

async function getDatabase(databaseId, token) {
  const meta = await notionFetch(`/databases/${databaseId}`, token);
  if (!meta.response.ok) return null;
  const query = await notionFetch(`/databases/${databaseId}/query`, token, {
    method: 'POST',
    body: JSON.stringify({ page_size: 25 })
  });
  if (!query.response.ok) throw new Error(query.body?.message || `Unable to query Notion database (${query.response.status})`);
  const pages = [];
  for (const page of query.body.results || []) {
    pages.push({
      id: page.id,
      title: titleFromPage(page),
      url: page.url,
      blocks: await getChildren(page.id, token)
    });
  }
  const databaseTitle = richText(meta.body?.title) || 'Notion database';
  return { id: meta.body.id, title: databaseTitle, pages };
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
