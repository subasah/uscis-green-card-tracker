import { REDDIT_DATA_URL, REDDIT_SUBREDDIT, REDDIT_TOPICS } from '../config';

export async function fetchRedditFeed() {
  const response = await fetch(REDDIT_DATA_URL);
  if (!response.ok) {
    throw new Error(`Reddit feed unavailable (HTTP ${response.status})`);
  }
  return response.json();
}

export function buildRedditInsights(feed) {
  const posts = feed?.posts ?? [];
  const topicCounts = Object.fromEntries(REDDIT_TOPICS.map((topic) => [topic.id, 0]));
  const postsByDay = {};
  const approvalPosts = [];
  const i485Posts = [];

  posts.forEach((post) => {
    (post.topics ?? []).forEach((topicId) => {
      if (topicCounts[topicId] != null) topicCounts[topicId] += 1;
    });

    if (post.topics?.includes('approval')) approvalPosts.push(post);
    if (post.topics?.includes('i485')) i485Posts.push(post);

    const day = post.publishedAt?.slice(0, 10);
    if (day) postsByDay[day] = (postsByDay[day] || 0) + 1;
  });

  const dailyActivity = Object.entries(postsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, count]) => ({ date, count }));

  const topTopics = REDDIT_TOPICS.map((topic) => ({
    ...topic,
    count: topicCounts[topic.id] ?? 0,
  }))
    .filter((topic) => topic.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    subreddit: feed?.subreddit ?? REDDIT_SUBREDDIT,
    subtitle: feed?.subtitle ?? '',
    syncedAt: feed?.syncedAt ?? null,
    sourceUrl: feed?.sourceUrl ?? `https://www.reddit.com/r/${REDDIT_SUBREDDIT}/`,
    totalPosts: posts.length,
    approvalPosts,
    i485Posts,
    topTopics,
    dailyActivity,
    posts,
  };
}

export function filterRedditPosts(posts, { query = '', topic = 'all' } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  return posts.filter((post) => {
    if (topic !== 'all' && !(post.topics ?? []).includes(topic)) return false;
    if (!normalizedQuery) return true;

    const haystack = [post.title, post.excerpt, post.author, post.signals?.blockNumber]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function formatRedditDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
