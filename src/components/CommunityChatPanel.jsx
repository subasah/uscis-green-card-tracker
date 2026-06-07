import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHAT_CONFIG } from '../config';

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMessageDay(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function messageGroups(messages) {
  const groups = [];
  let current = null;

  for (const message of messages) {
    const day = formatMessageDay(message.created_at);
    if (!current || current.day !== day) {
      current = { day, items: [] };
      groups.push(current);
    }
    current.items.push(message);
  }

  return groups;
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

  const groupedMessages = useMemo(() => messageGroups(messages), [messages]);

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

  const submitMessage = async () => {
    if (!canChat || sending || !draft.trim()) return;
    const ok = await sendMessage(draft);
    if (ok) {
      setDraft('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const handleDraftChange = (event) => {
    setDraft(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
  };

  if (!open) return null;

  const subtitle = !configured
    ? 'Chat is not configured yet.'
    : loading
      ? 'Connecting…'
      : `${onlineCount} online`;

  const placeholder = 'Message the room…';

  return createPortal(
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
            <p className="chat-empty-copy">No messages yet. Say hi.</p>
          ) : null}

          {groupedMessages.map((group) => (
            <div key={group.day} className="chat-day-group">
              <div className="chat-day-divider">
                <span>{group.day}</span>
              </div>
              {group.items.map((message, index) => {
                const mine = message.author_id === authorId;
                const prev = group.items[index - 1];
                const showAuthor =
                  !prev ||
                  prev.author_id !== message.author_id ||
                  prev.display_name !== message.display_name;

                return (
                  <article
                    key={message.id}
                    className={`chat-message-row${mine ? ' chat-message-row-mine' : ' chat-message-row-other'}`}
                  >
                    {showAuthor ? (
                      <span className="chat-message-author">{mine ? 'You' : message.display_name}</span>
                    ) : null}
                    <div className={`chat-message-bubble${mine ? ' chat-message-bubble-mine' : ''}`}>
                      {message.body}
                    </div>
                    {showAuthor ? (
                      <time className="chat-message-time" dateTime={message.created_at}>
                        {formatMessageTime(message.created_at)}
                      </time>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ))}
        </div>

        <form className="chat-compose chat-compose-compact" onSubmit={handleSend}>
          <div className="chat-compose-row">
            <textarea
              ref={inputRef}
              rows={1}
              maxLength={CHAT_CONFIG.maxMessageLength}
              placeholder={placeholder}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              disabled={!canChat || !configured || sending}
              aria-label="Message"
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={!canChat || !configured || sending || !draft.trim()}
              aria-label="Send message"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
          <span className="chat-compose-hint">
            Enter to send · Shift+Enter for new line
            {profile?.displayName ? ` · ${profile.displayName} · ${CHAT_CONFIG.retentionDays}d history` : ''}
          </span>
        </form>
      </aside>
    </div>,
    document.body
  );
}
