import { useEffect, useRef } from 'react';
import { getAccessToken } from '../services/authStorage';
import { WS_BASE_URL } from '../services/apiConfig';

const WS_URL = `${WS_BASE_URL}/ws/calendar/`;
const RECONNECT_MS = 3000;

/**
 * Opens a live connection to the app's push channel (calendar changes +
 * personal notifications — see events/consumers.py) and dispatches to
 * whichever handler matches the pushed message's `type`:
 *   - onEventsChanged()      — a calendar Event was created/updated/deleted
 *   - onActivitiesChanged()  — a course Activity was created/updated/deleted
 *   - onNotification(data)   — a notification was created for this user;
 *                              data = { title, message, link }
 *   - onChatMessage(data)    — a new batch chat message arrived;
 *                              data = { id, sender_id, sender_name, body, created_at }
 *   - onDmMessage(data)      — a new direct message arrived;
 *                              data = { conversation_id, id, sender_id, sender_name, body, created_at }
 *
 * The calendar handlers are just "go refetch" pings — the socket never
 * carries event/activity payloads itself, so it can't drift from the REST
 * endpoints' own visibility rules. Notifications, chat messages, and DMs
 * are the exception: each push is already addressed to exactly the right
 * audience (a per-recipient group for notifications/DMs, a per-batch group
 * only that batch's students joined for chat), so it's no less scoped than
 * the REST endpoint, and carrying the content lets the caller render it
 * immediately without a round trip.
 *
 * Falls back gracefully: if the socket can't connect or drops, it keeps
 * retrying in the background, and the caller's normal polling (if any)
 * still covers updates in the meantime.
 */
export default function useLiveSocket({ onEventsChanged, onActivitiesChanged, onNotification, onChatMessage, onDmMessage } = {}) {
  const handlersRef = useRef({});

  useEffect(() => {
    handlersRef.current = { onEventsChanged, onActivitiesChanged, onNotification, onChatMessage, onDmMessage };
  }, [onEventsChanged, onActivitiesChanged, onNotification, onChatMessage, onDmMessage]);

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let cancelled = false;

    const connect = () => {
      const token = getAccessToken();
      if (!token || cancelled) return;

      socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const handlers = handlersRef.current;
          if (data.type === 'events_changed') handlers.onEventsChanged?.();
          else if (data.type === 'activities_changed') handlers.onActivitiesChanged?.();
          else if (data.type === 'notification') handlers.onNotification?.(data);
          else if (data.type === 'chat_message') handlers.onChatMessage?.(data);
          else if (data.type === 'dm_message') handlers.onDmMessage?.(data);
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_MS);
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);
}
