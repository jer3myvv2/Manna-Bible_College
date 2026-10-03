/**
 * Live admin notifications.
 *
 * Polls GET /api/admin/notifications (every 15s while the tab is visible, every
 * 60s in the background), raises toasts for anything new, optionally plays a
 * chime or shows a desktop notification, and bumps `version` so open pages can
 * refresh their data. Polling was chosen over WebSockets/SSE so it works with a
 * plain Gunicorn deployment and no extra services.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';
import { getNotifications, markNotificationsSeen } from '../api/admin';

const VISIBLE_INTERVAL = 15_000;
const HIDDEN_INTERVAL = 60_000;
const PREFS_KEY = 'manna_admin_prefs';
const DEFAULT_PREFS = { sound: false, desktop: false };

const AdminNotificationsContext = createContext(null);

function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}') };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable (private mode): preferences last for this visit only */
  }
}

/** Short two-note chime made with Web Audio (no sound file to download). */
function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    [660, 880].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + index * 0.14;
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    window.setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio blocked until the user interacts with the page: ignore */
  }
}

function showDesktopNotification(item) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(item.title, { body: item.body, icon: '/icons/icon-192.png', tag: item.id });
    notification.onclick = () => {
      window.focus();
      window.location.assign(item.link);
    };
  } catch {
    /* some browsers only allow notifications from a service worker */
  }
}

export function AdminNotificationsProvider({ children }) {
  const [feed, setFeed] = useState({
    items: [],
    unreadCount: 0,
    counts: { new_applications: 0, unread_messages: 0 },
    loaded: false,
    error: '',
    checkedAt: null,
  });
  const [toasts, setToasts] = useState([]);
  const [version, setVersion] = useState(0);
  const [prefs, setPrefsState] = useState(loadPrefs);
  const knownIds = useRef(null); // ids from the previous poll; null until the first load
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const dismissToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.toastId !== toastId));
  }, []);

  const poll = useCallback(async () => {
    try {
      const data = await getNotifications();
      const fresh = knownIds.current ? data.items.filter((item) => !knownIds.current.has(item.id)) : [];
      knownIds.current = new Set(data.items.map((item) => item.id));

      if (fresh.length) {
        const stamp = Date.now();
        setToasts((current) =>
          [...fresh.slice(0, 3).map((item) => ({ ...item, toastId: `${item.id}-${stamp}` })), ...current].slice(0, 4),
        );
        setVersion((value) => value + 1);
        if (prefsRef.current.sound) playChime();
        if (prefsRef.current.desktop && document.hidden) showDesktopNotification(fresh[0]);
      }
      setFeed({
        items: data.items,
        unreadCount: data.unread_count,
        counts: data.counts,
        loaded: true,
        error: '',
        checkedAt: new Date(),
      });
    } catch (err) {
      setFeed((current) => ({ ...current, loaded: true, error: getErrorMessage(err) }));
    }
  }, []);

  // Poll on a timer that slows down while the tab is in the background.
  useEffect(() => {
    let timer;
    let stopped = false;
    const schedule = () => {
      window.clearTimeout(timer);
      if (stopped) return;
      timer = window.setTimeout(async () => {
        await poll();
        schedule();
      }, document.hidden ? HIDDEN_INTERVAL : VISIBLE_INTERVAL);
    };
    const onVisibility = async () => {
      if (!document.hidden) {
        await poll();
        schedule();
      }
    };
    poll().then(schedule);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [poll]);

  const markAllSeen = useCallback(async () => {
    setFeed((current) => ({
      ...current,
      unreadCount: 0,
      items: current.items.map((item) => ({ ...item, unread: false })),
    }));
    try {
      await markNotificationsSeen();
    } catch {
      /* the next poll will restore the real count */
    }
  }, []);

  const setPrefs = useCallback(async (changes) => {
    const next = { ...prefsRef.current, ...changes };
    if (changes.desktop && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') next.desktop = false;
    }
    if (changes.sound) playChime(); // let the admin hear what it sounds like
    savePrefs(next);
    setPrefsState(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({ ...feed, toasts, dismissToast, version, refresh: poll, markAllSeen, prefs, setPrefs }),
    [feed, toasts, dismissToast, version, poll, markAllSeen, prefs, setPrefs],
  );

  return <AdminNotificationsContext.Provider value={value}>{children}</AdminNotificationsContext.Provider>;
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) throw new Error('useAdminNotifications must be used inside AdminNotificationsProvider');
  return context;
}

/** Version counter that changes whenever new activity arrives (0 outside the admin shell). */
export function useLiveVersion() {
  return useContext(AdminNotificationsContext)?.version ?? 0;
}
