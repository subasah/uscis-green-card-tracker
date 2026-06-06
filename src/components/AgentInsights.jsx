import { useMemo } from 'react';

export default function AgentInsights({ agents, rules }) {
  const helpfulAgents = useMemo(
    () => agents.filter((agent) => agent.helpful).slice(0, 12),
    [agents]
  );

  const helpfulRate = agents.length
    ? Math.round((helpfulAgents.length / agents.length) * 100)
    : null;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Emma agent tips</h2>
          <p>Which live agents were helpful and what they answered — from the community spreadsheet.</p>
        </div>
      </div>

      {agents.length ? (
        <p className="muted-copy">
          {helpfulRate}% of logged chats rated helpful ({helpfulAgents.length}/{agents.length}).
        </p>
      ) : null}

      <div className="agent-list">
        {helpfulAgents.length ? (
          helpfulAgents.map((agent) => (
            <div key={agent.id} className="agent-card">
              <strong>{agent.name}</strong>
              <span>{agent.agentId || 'No ID'} · {agent.dateContacted ? agent.dateContacted.toLocaleDateString() : ''}</span>
              <p>{agent.comment}</p>
            </div>
          ))
        ) : (
          <p className="muted-copy">No agent data loaded yet.</p>
        )}
      </div>

      {rules?.links?.length ? (
        <div className="detail-card">
          <h3>External links</h3>
          <div className="resource-links">
            {rules.links.slice(0, 6).map((link) => (
              <a key={link} href={link} target="_blank" rel="noreferrer">{link.replace(/^https?:\/\//, '').slice(0, 50)}</a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
