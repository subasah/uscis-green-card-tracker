import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUBREDDIT = 'EB2_NIW';
const RSS_URL = `https://www.reddit.com/r/${SUBREDDIT}/.rss`;
const USER_AGENT = 'uscis-green-card-tracker/1.0 (community dashboard; github.com/uscis-green-card-tracker)';
const OUTPUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/data/reddit-eb2niw.json');

const TOPIC_RULES = [
  { id: 'approval', label: 'Approval', pattern: /\b(approved|approval|case approved|gc approved|i-140 approved|i-485 approved)\b/i },
  { id: 'i485', label: 'I-485 / AOS', pattern: /\b(i-485|i485|aos|biometric|silent update|fta0|field office|nbc|interview waived)\b/i },
  { id: 'i140', label: 'I-140 / NIW', pattern: /\b(i-140|i140|niw|rfe|premium processing|\bpp\b|priority date|\bpd\b)\b/i },
  { id: 'lawyer', label: 'Lawyer / firm', pattern: /\b(lawyer|attorney|wegreened|chen\b|\bep\b|firm)\b/i },
  { id: 'timeline', label: 'Timeline', pattern: /\b(timeline|receipt date|\brd\b|how long|processing time|estimate)\b/i },
  { id: 'question', label: 'Question', pattern: /\?|^(anyone|has anyone|does anyone|should i|looking for advice)/i },
];

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#32;/g, ' ');
}

function stripHtml(html) {
  return decodeXml(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1].trim()) : '';
}

function getLinkHref(block) {
  const match = block.match(/<link[^>]+href="([^"]+)"/);
  return match ? match[1] : '';
}

function getAuthor(block) {
  const match = block.match(/<author>\s*<name>([^<]+)<\/name>/);
  return match ? decodeXml(match[1].trim()) : '';
}

function tagPost(title, body) {
  const text = `${title} ${body}`;
  return TOPIC_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.id);
}

function extractSignals(text) {
  const blockMatch = text.match(/\bIOE\d{4,6}\b/i);
  const receiptMatch = text.match(/\bRD[:\s]+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  const pdMatch = text.match(/\bPD[:\s]+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  const countryMatch = text.match(/\b(?:row\s*)?75\b|\b75 (?:countries|coc|list)\b/i);

  return {
    blockNumber: blockMatch ? blockMatch[0].toUpperCase() : null,
    receiptDate: receiptMatch?.[1] ?? null,
    priorityDate: pdMatch?.[1] ?? null,
    mentionsCountry75: Boolean(countryMatch),
  };
}

function parseAtomFeed(xml) {
  const subtitleMatch = xml.match(/<subtitle>([^<]*)<\/subtitle>/);
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = getTag(block, 'title');
    const contentHtml = getTag(block, 'content');
    const body = stripHtml(contentHtml).replace(/\s*submitted by[\s\S]*$/i, '').trim();
    const combined = `${title} ${body}`;

    entries.push({
      id: getTag(block, 'id') || getLinkHref(block),
      title,
      url: getLinkHref(block),
      author: getAuthor(block),
      publishedAt: getTag(block, 'published') || getTag(block, 'updated'),
      excerpt: body.slice(0, 320) + (body.length > 320 ? '…' : ''),
      topics: tagPost(title, body),
      signals: extractSignals(combined),
    });
  }

  return {
    subreddit: SUBREDDIT,
    subtitle: subtitleMatch ? decodeXml(subtitleMatch[1]) : '',
    posts: entries,
  };
}

async function main() {
  const response = await fetch(RSS_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/atom+xml, application/xml, text/xml' },
  });

  if (!response.ok) {
    throw new Error(`Reddit RSS fetch failed: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parseAtomFeed(xml);
  const payload = {
    ...parsed,
    syncedAt: new Date().toISOString(),
    sourceUrl: `https://www.reddit.com/r/${SUBREDDIT}/`,
    feedUrl: RSS_URL,
    postCount: parsed.posts.length,
  };

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${payload.postCount} posts to ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
