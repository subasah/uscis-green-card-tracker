import { useCallback, useEffect, useRef, useState } from 'react';
import {
  connectPresence,
  ensureChatSession,
  ensureGuestProfile,
  fetchRecentMessages,
  isChatConfigured,
  loadChatProfile,
  sendChatMessage,
  subscribeToMessages,
} from '../utils/chatService';

function mergeMessage(list, message) {
  if (!message?.id || list.some((item) => item.id === message.id)) return list;
  return [...list, message].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function useCommunityChat({ enabled = true } = {}) {
  const configured = isChatConfigured();
  const [chatOpen, setChatOpen] = useState(false);
  const [profile, setProfile] = useState(() => loadChatProfile());
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [authorId, setAuthorId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const profileRef = useRef(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const bootstrap = useCallback(async () => {
    if (!configured || !enabled) return;

    setLoading(true);
    setError('');

    try {
      const session = await ensureChatSession();
      setAuthorId(session.user.id);

      const guestProfile = ensureGuestProfile();
      setProfile(guestProfile);

      const history = await fetchRecentMessages();
      setMessages(history);
      setReady(true);
    } catch (err) {
      setError(err.message);
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, [configured, enabled]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!configured || !enabled || !ready) return undefined;

    return subscribeToMessages((message) => {
      setMessages((current) => mergeMessage(current, message));
    });
  }, [configured, enabled, ready]);

  useEffect(() => {
    if (!configured || !enabled || !profile?.displayName || !ready) {
      setOnlineCount(0);
      return undefined;
    }

    let disconnect = () => {};

    connectPresence(profile, ({ count, ready: presenceReady }) => {
      if (presenceReady) setOnlineCount(count);
    }).then((cleanup) => {
      disconnect = cleanup;
    });

    return () => disconnect();
  }, [configured, enabled, profile, ready]);

  const sendMessage = useCallback(
    async (body) => {
      const activeProfile = profileRef.current || profile;
      setSending(true);
      setError('');

      try {
        const message = await sendChatMessage({
          body,
          displayName: activeProfile?.displayName,
          caseTag: null,
          authorId,
        });
        setMessages((current) => mergeMessage(current, message));
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setSending(false);
      }
    },
    [authorId, profile]
  );

  const canChat = configured && ready;

  return {
    configured,
    chatOpen,
    setChatOpen,
    profile,
    messages,
    onlineCount,
    authorId,
    loading,
    sending,
    error,
    setError,
    ready,
    canChat,
    sendMessage,
    refresh: bootstrap,
  };
}
