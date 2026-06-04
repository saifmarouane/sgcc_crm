"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TopbarNotification = {
  id: string;
  notification: string;
  readAt: string | null;
  createdAt: string;
};

const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const months = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

function formatClock(now: Date) {
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return {
    date: `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
    seconds: `:${seconds}`,
    time: `${hours}:${minutes}`,
  };
}

function Icon({ name }: { name: "bell" | "calendar" | "chevron-left" | "chevron-right" }) {
  const paths = {
    bell: (
      <>
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    calendar: (
      <>
        <path d="M7 3v3" />
        <path d="M17 3v3" />
        <path d="M4 8h16" />
        <path d="M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      </>
    ),
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

export function TopbarWidgets({ token }: { token: string }) {
  const [now, setNow] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<TopbarNotification[]>([]);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const clock = formatClock(now);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function closePopovers(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setCalendarOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("click", closePopovers);
    return () => document.removeEventListener("click", closePopovers);
  }, []);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }

    let ignore = false;

    async function loadNotifications() {
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!ignore && response.ok) {
        setNotifications(data.notifications ?? []);
      }
    }

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, [token]);

  const calendar = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: Array<{ day: number; key: string; type: "current" | "other"; today?: boolean }> = [];

    for (let index = startOffset; index > 0; index -= 1) {
      cells.push({ day: daysInPrevMonth - index + 1, key: `prev-${index}`, type: "other" });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        day,
        key: `current-${day}`,
        today:
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
        type: "current",
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day += 1) {
      cells.push({ day, key: `next-${day}`, type: "other" });
    }

    return { cells, month, year };
  }, [calendarDate]);

  function changeMonth(direction: number) {
    setCalendarDate((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + direction);
      return next;
    });
  }

  async function markNotificationAsRead(notificationId: string) {
    if (!token) {
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() }
          : notification,
      ),
    );

    await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ read: true }),
    });
  }

  return (
    <div className="topbar-widgets" ref={rootRef}>
      <div className="nb-datetime" aria-label="Heure actuelle">
        <span className="nb-time">{clock.time}</span>
        <span className="nb-sec">{clock.seconds}</span>
      </div>

      <span className="nb-date">{clock.date}</span>
      <span className="nb-divider" aria-hidden="true" />

      <button
        aria-expanded={calendarOpen}
        aria-label="Afficher le calendrier"
        className="nb-btn"
        onClick={() => setCalendarOpen((open) => !open)}
        type="button"
      >
        <Icon name="calendar" />
      </button>

      <button
        aria-expanded={notificationsOpen}
        className="nb-btn"
        aria-label={`${unreadCount} notifications non lues`}
        onClick={() => {
          setNotificationsOpen((open) => !open);
          setCalendarOpen(false);
        }}
        type="button"
      >
        <Icon name="bell" />
        {unreadCount ? (
          <span className="nb-count" aria-hidden="true">
            {unreadCount}
          </span>
        ) : null}
      </button>

      <div
        className={`notif-popup${notificationsOpen ? " open" : ""}`}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="notif-header">
          <strong>Notifications</strong>
          <span>{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</span>
        </div>
        <div className="notif-list">
          {notifications.length ? (
            notifications.slice(0, 8).map((notification) => (
              <button
                className={`notif-item${notification.readAt ? "" : " unread"}`}
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                type="button"
              >
                <span>{notification.notification}</span>
                <small>
                  {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </small>
              </button>
            ))
          ) : (
            <p className="notif-empty">Aucune notification.</p>
          )}
        </div>
      </div>

      <div className={`cal-popup${calendarOpen ? " open" : ""}`} role="dialog" aria-label="Calendrier">
        <div className="cal-header">
          <span className="cal-month">
            {months[calendar.month]} {calendar.year}
          </span>
          <div className="cal-nav">
            <button aria-label="Mois precedent" onClick={() => changeMonth(-1)} type="button">
              <Icon name="chevron-left" />
            </button>
            <button aria-label="Mois suivant" onClick={() => changeMonth(1)} type="button">
              <Icon name="chevron-right" />
            </button>
          </div>
        </div>
        <div className="cal-grid">
          {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
            <span className="cal-dow" key={`${day}-${index}`}>
              {day}
            </span>
          ))}
          {calendar.cells.map((cell) => (
            <span
              className={`cal-day${cell.type === "other" ? " other" : ""}${cell.today ? " today" : ""}`}
              key={cell.key}
            >
              {cell.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
