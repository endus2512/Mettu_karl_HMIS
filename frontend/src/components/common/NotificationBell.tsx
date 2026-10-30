/**
 * Interactive Hospital Notification Bell & Real-Time Reaction Drawer.
 * Displays real-time alerts from the Hospital Administrator to Doctors, Nurses,
 * Pharmacists, Technicians, and Patients, with 1-click clinical reactions.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/lib/auth';
import { useTranslation, Language } from '@/lib/i18n';
import {
  HospitalNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  reactToNotification,
  clearAllNotifications,
  ReactionType,
} from '@/lib/notifications';

interface NotificationBellProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const BELL_I18N: Record<Language, {
  title: string;
  empty: string;
  all: string;
  unread: string;
  clearAll: string;
  sender: string;
  reactedBy: string;
  quickReply: string;
  sendReply: string;
  replyPlaceholder: string;
  toastTitle: string;
  toastMsg: string;
}> = {
  en: {
    title: 'Hospital Executive Alerts & Notifications',
    empty: 'No notifications at this moment.',
    all: 'All',
    unread: 'Unread',
    clearAll: 'Clear All',
    sender: 'From:',
    reactedBy: 'You reacted:',
    quickReply: 'Write quick reply...',
    sendReply: 'Send Reply',
    replyPlaceholder: 'Type a message to administration...',
    toastTitle: 'Response Dispatched!',
    toastMsg: 'Your reaction has been sent directly to Hospital Executive Command.',
  },
  om: {
    title: "Beeksisa & Ergaa Bulchiinsa Hospitaalaa",
    empty: 'Yeroo ammaa beeksisni haaraan hin jiru.',
    all: 'Hunda',
    unread: 'Kan Hin Dubbifamne',
    clearAll: 'Hunda Haqi',
    sender: 'Kallattii:',
    reactedBy: 'Deebiin keessan:',
    quickReply: 'Deebii gabaabaa barreessi...',
    sendReply: 'Deebii Ergi',
    replyPlaceholder: 'Ergaa deebii gara bulchiinsaatti ergi...',
    toastTitle: "Deebiin Ergameera!",
    toastMsg: "Deebiin keessan kallattiin gara Waajjira Bulchiinsa Hospitaalaatti ergameera.",
  },
  am: {
    title: 'የሆስፒታል አስተዳደር ማሳወቂያዎችና ጥሪዎች',
    empty: 'በአሁኑ ሰዓት ምንም ማሳወቂያ የለም።',
    all: 'ሁሉም',
    unread: 'ያልተነበቡ',
    clearAll: 'ሁሉንም አጽዳ',
    sender: 'ላኪ:',
    reactedBy: 'የሰጡት ምላሽ:',
    quickReply: 'ፈጣን ምላሽ ይጻፉ...',
    sendReply: 'ምላሽ ላክ',
    replyPlaceholder: 'ለአስተዳደሩ አጭር ምላሽ ይጻፉ...',
    toastTitle: 'ምላሹ ተልኳል!',
    toastMsg: 'የሰጡት ምላሽ በቀጥታ ለሆስፒታሉ አስተዳደር ደርሷል።',
  },
};

export function NotificationBell({ variant = 'dark', className = '' }: NotificationBellProps): React.ReactElement {
  const { user } = useAuth();
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';
  const txt = BELL_I18N[lang] || BELL_I18N['en'];

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<HospitalNotification[]>([]);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to notification updates
  const refreshNotifications = () => {
    const list = getNotificationsForUser(user?.role, user?.username);
    setItems(list);
  };

  useEffect(() => {
    refreshNotifications();
    const handleUpdate = () => refreshNotifications();
    window.addEventListener('mkh-notification-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('mkh-notification-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user?.role, user?.username]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const filteredItems = items.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const handleReact = (
    notifId: string,
    type: ReactionType,
    labels: { en: string; om: string; am: string },
    note?: string
  ) => {
    const responderName = user?.username === 'admin'
      ? 'Administrator'
      : user?.username === 'nurse_chaltu'
      ? 'Nurse Chaltu'
      : 'Dr. Bekele Tadesse';

    reactToNotification(notifId, {
      type,
      label: labels,
      responderName,
      responderRole: user?.role || 'doctor',
      replyNote: note,
    });

    notifications.show({
      title: txt.toastTitle,
      message: `${labels[lang]} — ${txt.toastMsg}`,
      color: 'teal',
    });

    setReplyOpenId(null);
    setReplyText('');
    refreshNotifications();
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button with Pulsing Counter */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          // Mark all as read when opening
          if (!isOpen && unreadCount > 0) {
            items.forEach((n) => markNotificationAsRead(n.id));
            refreshNotifications();
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={txt.title}
        className={`relative flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
          variant === 'light'
            ? 'border-2 border-slate-200 bg-white hover:border-teal-400 text-slate-700 hover:text-teal-900 shadow-xs'
            : 'border border-slate-700/90 bg-slate-800/90 hover:bg-slate-700 text-teal-300 hover:text-white shadow-xs'
        }`}
      >
        <span className="text-lg">🔔</span>

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-md ring-2 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Downward Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl border-2 border-teal-500/80 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔔</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black leading-tight tracking-tight">
                  {txt.title}
                </h3>
                <span className="text-[10px] font-bold text-teal-300">
                  {unreadCount > 0 ? `${unreadCount} ${txt.unread}` : 'All caught up'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Filter Bar & Clear Actions */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {txt.all} ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {txt.unread} ({unreadCount})
              </button>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearAllNotifications();
                  refreshNotifications();
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                {txt.clearAll}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-xs font-semibold text-slate-500">{txt.empty}</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const titleStr = item.title[lang] || item.title.en;
                const msgStr = item.message[lang] || item.message.en;
                const timeAgo = formatTimeAgo(item.timestamp);

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${
                      item.read ? 'bg-white' : 'bg-teal-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.type === 'code_blue' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                            🚨 CODE BLUE
                          </span>
                        )}
                        {item.type === 'urgent_rx' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 border border-purple-300 px-2 py-0.5 text-[10px] font-black text-purple-800 uppercase">
                            💊 URGENT RX
                          </span>
                        )}
                        {item.type === 'directive' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 border border-teal-300 px-2 py-0.5 text-[10px] font-black text-teal-800 uppercase">
                            📋 DIRECTIVE
                          </span>
                        )}
                        {item.type === 'broadcast' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-800 uppercase">
                            📢 BROADCAST
                          </span>
                        )}
                        {item.type === 'custom' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-black text-blue-800 uppercase">
                            💬 MESSAGE
                          </span>
                        )}

                        <span className="text-[10px] font-medium text-slate-400">
                          {timeAgo}
                        </span>
                      </div>

                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>

                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {titleStr}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {msgStr}
                    </p>

                    {/* Reaction status if already responded */}
                    {item.reaction ? (
                      <div className="mt-2.5 rounded-xl bg-teal-50 border border-teal-200 p-2 text-[11px] text-teal-900 font-bold flex items-center justify-between">
                        <span>
                          {txt.reactedBy} {item.reaction.label[lang] || item.reaction.label.en}
                        </span>
                        <span className="text-[10px] text-teal-700 font-normal">
                          {formatTimeAgo(item.reaction.timestamp)}
                        </span>
                      </div>
                    ) : (
                      /* Action / Reaction Buttons */
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {item.type === 'code_blue' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleReact(item.id, 'on_my_way', {
                                  en: '🏃 On My Way! (Arriving <2m)',
                                  om: '🏃 Deemaan Jira! (<2m)',
                                  am: '🏃 አሁን እየመጣሁ ነው (<2 ደቂቃ)',
                                })
                              }
                              className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black px-2.5 py-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              🏃 On My Way (Deemaan Jira)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleReact(item.id, 'at_bedside', {
                                  en: '✅ At Bedside Resuscitation',
                                  om: '✅ Siree Tasaa Biran Jira',
                                  am: '✅ አልጋው አጠገብ ደርሻለሁ',
                                })
                              }
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-2.5 py-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              ✅ At Bedside
                            </button>
                          </>
                        )}

                        {item.type === 'urgent_rx' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleReact(item.id, 'dispensed', {
                                  en: '✅ Dispensed & Ready',
                                  om: '✅ Kennameera / Qophiidha',
                                  am: '✅ ታድሏል / ዝግጁ ሆኗል',
                                })
                              }
                              className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-black px-2.5 py-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              ✅ Dispensed & Ready
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleReact(item.id, 'in_progress', {
                                  en: '⏳ In Preparation',
                                  om: '⏳ Qophaa\'aa Jira',
                                  am: '⏳ በመዘጋጀት ላይ ነው',
                                })
                              }
                              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-2.5 py-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              ⏳ In Prep
                            </button>
                          </>
                        )}

                        {(item.type === 'directive' || item.type === 'broadcast') && (
                          <button
                            type="button"
                            onClick={() =>
                              handleReact(item.id, 'acknowledged', {
                                en: '👍 Acknowledged & Noted',
                                om: '👍 Hubadheera, Hojiirra Ooleera',
                                am: '👍 ተረድቻለሁ፣ ተፈፅሟል',
                              })
                            }
                            className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-black px-3 py-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            👍 Acknowledge (Hubadheera)
                          </button>
                        )}

                        {/* Quick Reply Trigger */}
                        <button
                          type="button"
                          onClick={() => setReplyOpenId(replyOpenId === item.id ? null : item.id)}
                          className="rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-1.5 transition-all cursor-pointer"
                        >
                          💬 Reply
                        </button>
                      </div>
                    )}

                    {/* Quick Reply Form */}
                    {replyOpenId === item.id && (
                      <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={txt.replyPlaceholder}
                          className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReplyOpenId(null)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!replyText.trim()) return;
                              handleReact(
                                item.id,
                                'custom_reply',
                                {
                                  en: `💬 Reply: "${replyText.trim()}"`,
                                  om: `💬 Deebii: "${replyText.trim()}"`,
                                  am: `💬 ምላሽ: "${replyText.trim()}"`,
                                },
                                replyText.trim()
                              );
                            }}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-black cursor-pointer shadow-2xs"
                          >
                            {txt.sendReply}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
}
