import { useEffect, useRef, useState } from 'react';
import { CHAT_CONFIG } from '../config';

function formatMessageTime(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CommunityChatPanel({
  open,
  onClose,
  configured,
  ready,
  loading,
  sending,
  error,
  profile,
  messages,
  onlineCount,
  authorId,
  canChat,
  sendMessage,
}) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!canChat || sending || !draft.trim()) return;
    const ok = await sendMessage(draft);
    if (ok) setDraft('');
  };

  if (!open) return null;

  const subtitle = !configured
    ? 'Chat is not configured yet.'
    : loading
      ? 'Connecting…'
      : `${onlineCount} online · last ${CHAT_CONFIG.retentionDays} days saved`;

  const placeholder =
    onlineCount >= 2
      ? 'Say hi — ask a question or share where you are in your case.'
      : 'You’re the only one here right now. Leave a message for the next person who joins.';

  return (
    <div className="chat-overlay" role="presentation" onClick={onClose}>
      <aside
        className="chat-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Community chat"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="chat-panel-header chat-panel-header-compact">
          <div>
            <h2>Community chat</h2>
            <p className="chat-panel-subtitle">{subtitle}</p>
          </div>
          <button type="button" className="chat-close-button" onClick={onClose} aria-label="Close chat">
            ×
          </button>
        </header>

        {error ? <p className="case-error-banner chat-error">{error}</p> : null}

        <div className="chat-message-list" ref={listRef}>
          {loading ? <p className="chat-empty-copy">Loading messages…</p> : null}
          {!loading && !messages.length ? (
            <p className="chat-empty-copy">No messages yet. Start the conversation.</p>
          ) : null}
          {messages.map((message) => {
            const mine = message.author_id === authorId;
            return (
              <article key={message.id} className={`chat-message${mine ? ' chat-message-mine' : ''}`}>
                <div className="chat-message-head">
                  <strong>{message.display_name}</strong>
                  <time dateTime={message.created_at}>{formatMessageTime(message.created_at)}</time>
                </div>
                <p>{message.body}</p>
              </article>
            );
          })}
        </div>

        <form className="chat-compose chat-compose-compact" onSubmit={handleSend}>
          <textarea
            ref={inputRef}
            rows={2}
            maxLength={CHAT_CONFIG.maxMessageLength}
            placeholder={placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!canChat || !configured || sending}
            aria-label="Message"
          />
          <div className="chat-compose-actions">
            <span className="chat-compose-hint">
              {profile?.displayName ? `You · ${profile.displayName}` : null}
            </span>
            <button
              type="submit"
              className="case-analyze-button"
              disabled={!canChat || !configured || sending || !draft.trim()}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
