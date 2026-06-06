export default function Timeline({ title, items, bare = false }) {
  if (!items?.length) return null;

  const content = (
    <>
      {title ? <h3>{title}</h3> : null}
      <div className="h-timeline-scroll">
        <ol className="h-timeline">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`h-timeline-item h-timeline-item--${item.state || 'future'} ${index < items.length - 1 ? 'has-connector' : ''}`}
            >
              <div className="h-timeline-node">
                <span className="h-timeline-dot" style={item.color ? { borderColor: item.color, background: item.color } : undefined} />
                {index < items.length - 1 ? <span className="h-timeline-connector" aria-hidden="true" /> : null}
              </div>
              <div className="h-timeline-body">
                <strong>{item.label}</strong>
                <span>{item.value || '—'}</span>
                {item.hint ? <small>{item.hint}</small> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );

  if (bare) {
    return <div className="h-timeline-wrap">{content}</div>;
  }

  return content;
}
