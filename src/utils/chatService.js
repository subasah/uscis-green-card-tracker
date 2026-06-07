import { createClient } from '@supabase/supabase-js';
import { CHAT_CONFIG } from '../config';
import { randomFunnyUsername } from './chatUsernames';

const PROFILE_STORAGE_KEY = 'uscis-chat-profile';
const RETENTION_MS = CHAT_CONFIG.retentionDays * 24 * 60 * 60 * 1000;

let supabaseClient = null;

export function isChatConfigured() {
  return Boolean(CHAT_CONFIG.url && CHAT_CONFIG.anonKey);
}

export function getSupabaseClient() {
  if (!isChatConfigured()) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(CHAT_CONFIG.url, CHAT_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseClient;
}

export function loadChatProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createGuestProfile() {
  return { displayName: randomFunnyUsername(), caseTag: '' };
}

export function ensureGuestProfile() {
  const existing = loadChatProfile();
  if (existing?.displayName?.trim() && !/^Guest [A-F0-9]{4}$/i.test(existing.displayName.trim())) {
    return existing;
  }
  const profile = createGuestProfile();
  saveChatProfile(profile);
  return profile;
}

export function saveChatProfile(profile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export async function ensureChatSession() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Community chat is not configured. Add Supabase keys to enable live chat.');
  }

  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return existing.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function fetchRecentMessages() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  await ensureChatSession();
  const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, created_at, author_id, display_name, body, case_tag')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(400);

  if (error) throw error;
  return data ?? [];
}

export async function sendChatMessage({ body, displayName, caseTag, authorId }) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Community chat is unavailable.');

  const trimmed = body.trim();
  if (!trimmed) throw new Error('Type a message before sending.');
  if (trimmed.length > CHAT_CONFIG.maxMessageLength) {
    throw new Error(`Message is too long (max ${CHAT_CONFIG.maxMessageLength} characters).`);
  }

  const session = await ensureChatSession();
  const name = (displayName || randomFunnyUsername())
    .trim()
    .slice(0, CHAT_CONFIG.maxDisplayNameLength);

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      author_id: authorId || session.user.id,
      display_name: name,
      body: trimmed,
      case_tag: caseTag || null,
    })
    .select('id, created_at, author_id, display_name, body, case_tag')
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToMessages(onInsert) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('community-chat-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function connectPresence(profile, onSync) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    onSync({ count: 0, peers: [], ready: false });
    return () => {};
  }

  const session = await ensureChatSession();
  const userId = session.user.id;
  let heartbeatId = null;
  let channel = null;
  let active = true;

  channel = supabase.channel('community-presence', {
    config: { presence: { key: userId } },
  });

  channel.on('presence', { event: 'sync' }, () => {
    if (!active) return;
    const state = channel.presenceState();
    const peers = Object.values(state).flat();
    onSync({ count: peers.length, peers, ready: true });
  });

  await channel.subscribe(async (status) => {
    if (status !== 'SUBSCRIBED' || !active) return;

    const payload = {
      display_name: profile.displayName,
      case_tag: profile.caseTag || null,
      online_at: new Date().toISOString(),
    };

    await channel.track(payload);

    heartbeatId = window.setInterval(() => {
      channel.track({
        ...payload,
        online_at: new Date().toISOString(),
      });
    }, 30000);
  });

  return () => {
    active = false;
    if (heartbeatId) window.clearInterval(heartbeatId);
    if (channel) supabase.removeChannel(channel);
  };
}
