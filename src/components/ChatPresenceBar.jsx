export default function ChatPresenceBar({ onlineCount, onOpenChat, configured }) {
  const label = configured
    ? onlineCount > 0
      ? `Chat · ${onlineCount} online`
      : 'Chat · be first'
    : 'Chat offline';

  return (
    <button
      type="button"
      className="toolbar-button toolbar-button-chat"
      onClick={onOpenChat}
      aria-label="Open community chat"
    >
      <span className="chat-dot chat-dot-green" aria-hidden="true" />
      {label}
    </button>
  );
}
