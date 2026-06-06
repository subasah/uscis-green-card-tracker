import { useMemo, useState } from 'react';
import { REDDIT_SOURCE_URL, REDDIT_TOPICS } from '../config';
import { buildRedditInsights, filterRedditPosts, formatRedditDate } from '../utils/redditService';

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  );
}

function TopicBadge({ topicId }) {
  const topic = REDDIT_TOPICS.find((item) => item.id === topicId);
  if (!topic) return null;
  return <span className={`reddit-topic reddit-topic-${topicId}`}>{topic.label}</span>;
}

export default function RedditInsights({ feed, loading, error, onRefresh }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');

  const insights = useMemo(() => (feed ? buildRedditInsights(feed) : null), [feed]);

  const filteredPosts = useMemo(
    () => (insights ? filterRedditPosts(insights.posts, { query, topic }) : []),
    [insights, query, topic]
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>r/{insights?.subreddit ?? 'EB2_NIW'}</h2>
          <p>
            Recent posts from the{' '}
            <a href={REDDIT_SOURCE_URL} target="_blank" rel="noreferrer">
              EB2 NIW subreddit
            </a>
            . Synced from Reddit RSS — refreshed hourly via GitHub Actions.
          </p>
          {insights?.syncedAt ? (
            <p className="filter-summary">
              Last synced {formatRedditDate(insights.syncedAt)} · showing {insights.totalPosts} recent posts
            </p>
          ) : null}
        </div>
        <button type="button" className="refresh-button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh feed'}
        </button>
      </div>

      {error ? <p className="error-inline">{error}</p> : null}

      {insights ? (
        <>
          <div className="stat-grid">
            <StatCard label="Recent posts" value={insights.totalPosts} hint="RSS window (~25 latest)" />
            <StatCard label="Approval posts" value={insights.approvalPosts.length} />
            <StatCard label="I-485 / AOS posts" value={insights.i485Posts.length} />
            <StatCard
              label="Most active topic"
              value={insights.topTopics[0]?.label ?? '—'}
              hint={
                insights.topTopics[0]
                  ? `${insights.topTopics[0].count} posts in current feed`
                  : undefined
              }
            />
          </div>

          {insights.topTopics.length ? (
            <div className="reddit-topic-strip">
              {insights.topTopics.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`reddit-topic-chip ${topic === item.id ? 'active' : ''}`}
                  onClick={() => setTopic(topic === item.id ? 'all' : item.id)}
                >
                  {item.label}
                  <strong>{item.count}</strong>
                </button>
              ))}
            </div>
          ) : null}

          <div className="reddit-filters">
            <label className="search-field">
              <span>Search posts</span>
              <input
                type="search"
                placeholder="Title, IOE block, silent update, lawyer…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span>Topic</span>
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="all">All topics</option>
                {REDDIT_TOPICS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="reddit-post-list">
            {filteredPosts.length ? (
              filteredPosts.map((post) => (
                <article key={post.id} className="reddit-post-card">
                  <div className="reddit-post-meta">
                    <span>{post.author || 'unknown'}</span>
                    <span>{formatRedditDate(post.publishedAt)}</span>
                  </div>
                  <h3>
                    <a href={post.url} target="_blank" rel="noreferrer">
                      {post.title}
                    </a>
                  </h3>
                  {post.excerpt ? <p>{post.excerpt}</p> : null}
                  <div className="reddit-post-tags">
                    {(post.topics ?? []).map((topicId) => (
                      <TopicBadge key={topicId} topicId={topicId} />
                    ))}
                    {post.signals?.blockNumber ? (
                      <span className="reddit-signal">{post.signals.blockNumber}</span>
                    ) : null}
                    {post.signals?.receiptDate ? (
                      <span className="reddit-signal">RD {post.signals.receiptDate}</span>
                    ) : null}
                    {post.signals?.priorityDate ? (
                      <span className="reddit-signal">PD {post.signals.priorityDate}</span>
                    ) : null}
                    {post.signals?.mentionsCountry75 ? (
                      <span className="reddit-signal">75 COC</span>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-copy">No posts match your search or topic filter.</p>
            )}
          </div>
        </>
      ) : loading ? (
        <p className="muted-copy">Loading Reddit feed…</p>
      ) : (
        <p className="muted-copy">
          Reddit feed not loaded yet. Run <code>npm run sync:reddit</code> locally or wait for the hourly GitHub Action sync.
        </p>
      )}
    </section>
  );
}
