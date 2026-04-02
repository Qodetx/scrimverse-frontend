import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Trash2,
  CheckCheck,
  Settings,
  Loader2,
  CheckSquare,
  Square,
  Trophy,
  Users,
  Key,
  AlertCircle,
  CreditCard,
  Star,
  Info,
} from 'lucide-react';
import { notificationAPI } from '../utils/api';
import './NotificationsPage.css';

const LIMIT = 20;

const NOTIF_ICON = {
  team_invite: { icon: Users, color: '#a78bfa' },
  match_start: { icon: Bell, color: '#f59e0b' },
  credential_release: { icon: Key, color: '#60a5fa' },
  slot_list: { icon: Key, color: '#34d399' },
  slot_list_release: { icon: Key, color: '#34d399' },
  results: { icon: Trophy, color: '#fbbf24' },
  tournament_result: { icon: Trophy, color: '#fbbf24' },
  teammate_joined: { icon: Users, color: '#a78bfa' },
  tournament_update: { icon: Trophy, color: '#c084fc' },
  registration_confirmed: { icon: CheckCheck, color: '#34d399' },
  payment_confirmed: { icon: CreditCard, color: '#34d399' },
  payment_received: { icon: CreditCard, color: '#34d399' },
  new_registration: { icon: Users, color: '#60a5fa' },
  slots_full: { icon: AlertCircle, color: '#f87171' },
  verification_approved: { icon: CheckCheck, color: '#34d399' },
  verification_rejected: { icon: AlertCircle, color: '#f87171' },
  points_entered: { icon: Star, color: '#fbbf24' },
  team_conversion_offer: { icon: Users, color: '#f59e0b' },
  team_conversion_reminder: { icon: Bell, color: '#f59e0b' },
  team_deleted: { icon: Trash2, color: '#f87171' },
  general: { icon: Info, color: '#94a3b8' },
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function NotificationsPage({ onUnreadChange, onOpenAlerts }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const observerRef = useRef(null);
  const bottomRef = useRef(null);

  const fetchNotifications = useCallback(
    async (off = 0, append = false) => {
      if (off === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await notificationAPI.getNotifications({ limit: LIMIT, offset: off });
        const data = res.data;
        const newItems = data.notifications || [];
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasMore(data.has_more || false);
        setOffset(off + newItems.length);
        if (onUnreadChange) onUnreadChange(data.unread_count || 0);
      } catch (e) {
        console.error('Failed to load notifications', e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [onUnreadChange]
  );

  useEffect(() => {
    fetchNotifications(0, false);
  }, [fetchNotifications]);

  // Infinite scroll observer
  useEffect(() => {
    if (!bottomRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchNotifications(offset, true);
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(bottomRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, offset, fetchNotifications]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((n) => n.id)));
  };

  const handleMarkRead = async (ids) => {
    setActionBusy(true);
    try {
      if (ids.length === 1) await notificationAPI.markRead(ids[0]);
      else await notificationAPI.bulkAction(ids, 'mark_read');
      setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n)));
      setSelected(new Set());
      const unread = items.filter((n) => !n.is_read && !ids.includes(n.id)).length;
      if (onUnreadChange) onUnreadChange(unread);
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async (ids) => {
    setActionBusy(true);
    try {
      await notificationAPI.bulkAction(ids, 'delete');
      setItems((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelected(new Set());
      const unread = items.filter((n) => !n.is_read && !ids.includes(n.id)).length;
      if (onUnreadChange) onUnreadChange(unread);
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionBusy(true);
    try {
      await notificationAPI.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (onUnreadChange) onUnreadChange(0);
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const selectedArr = Array.from(selected);
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="np-page">
      {/* Header */}
      <div className="np-header">
        <div className="np-header-left">
          <Bell size={20} className="np-header-icon" />
          <h1 className="np-title">Notifications</h1>
          {unreadCount > 0 && <span className="np-unread-badge">{unreadCount}</span>}
        </div>
        <div className="np-header-actions">
          {unreadCount > 0 && (
            <button
              className="np-action-btn"
              onClick={handleMarkAllRead}
              disabled={actionBusy}
              title="Mark all read"
            >
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          <button
            className={`np-action-btn${selectMode ? ' np-action-btn-active' : ''}`}
            onClick={() => {
              setSelectMode((v) => !v);
              setSelected(new Set());
            }}
            title="Select"
          >
            <CheckSquare size={15} /> Select
          </button>
          {onOpenAlerts !== undefined && (
            <button
              className="np-action-btn np-action-btn-icon"
              onClick={() =>
                onOpenAlerts
                  ? onOpenAlerts()
                  : navigate('/player/dashboard', { state: { openSettings: 'alerts' } })
              }
              title="Notification settings"
            >
              <Settings size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="np-bulk-bar">
          <button className="np-bulk-select-all" onClick={toggleSelectAll}>
            {selected.size === items.length && items.length > 0 ? (
              <CheckSquare size={14} />
            ) : (
              <Square size={14} />
            )}
            {selected.size === items.length && items.length > 0 ? 'Deselect all' : 'Select all'}
          </button>
          <span className="np-bulk-count">{selected.size} selected</span>
          <div className="np-bulk-btns">
            <button
              className="np-bulk-btn np-bulk-btn-read"
              disabled={selected.size === 0 || actionBusy}
              onClick={() => handleMarkRead(selectedArr)}
            >
              <CheckCheck size={13} /> Mark read
            </button>
            <button
              className="np-bulk-btn np-bulk-btn-delete"
              disabled={selected.size === 0 || actionBusy}
              onClick={() => handleDelete(selectedArr)}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="np-loading">
          <Loader2 size={28} className="np-spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="np-empty">
          <Bell size={40} className="np-empty-icon" />
          <p className="np-empty-title">No notifications</p>
          <p className="np-empty-sub">You're all caught up!</p>
        </div>
      ) : (
        <div className="np-list">
          {items.map((n) => {
            const meta = NOTIF_ICON[n.type] || NOTIF_ICON.general;
            const IconComp = meta.icon;
            const isSelected = selected.has(n.id);
            return (
              <div
                key={n.id}
                className={`np-item${!n.is_read ? ' np-item-unread' : ''}${isSelected ? ' np-item-selected' : ''}`}
                onClick={() =>
                  selectMode ? toggleSelect(n.id) : !n.is_read && handleMarkRead([n.id])
                }
              >
                {selectMode && (
                  <div className="np-item-checkbox">
                    {isSelected ? (
                      <CheckSquare size={16} color="hsl(var(--purple))" />
                    ) : (
                      <Square size={16} />
                    )}
                  </div>
                )}
                <div
                  className="np-item-icon-wrap"
                  style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
                >
                  <IconComp size={16} style={{ color: meta.color }} />
                </div>
                <div className="np-item-body">
                  <div className="np-item-title">{n.title}</div>
                  <div className="np-item-msg">{n.message}</div>
                  <div className="np-item-time">{timeAgo(n.created_at)}</div>
                </div>
                {!selectMode && (
                  <div className="np-item-actions">
                    {!n.is_read && (
                      <button
                        className="np-item-btn"
                        title="Mark read"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead([n.id]);
                        }}
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}
                    <button
                      className="np-item-btn np-item-btn-delete"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete([n.id]);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
                {!n.is_read && <span className="np-unread-dot" />}
              </div>
            );
          })}

          {/* Infinite scroll trigger */}
          <div ref={bottomRef} className="np-bottom-anchor">
            {loadingMore && <Loader2 size={20} className="np-spinner" />}
          </div>
        </div>
      )}
    </div>
  );
}
