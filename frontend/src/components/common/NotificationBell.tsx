/**
 * Interactive Hospital Notification Bell & Real-Time Reaction Drawer.
 * Displays real-time alerts from the Hospital Administrator to Doctors, Nurses,
 * Pharmacists, Technicians, and Patients, with 1-click clinical reactions.
 * Elevated with Lucide React SVG icons and dark mode compatibility.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/lib/auth';
import { useTranslation, Language } from '@/lib/i18n';
import {
  Bell,
  X,
  AlertOctagon,
  Pill,
  ClipboardCheck,
  Radio,
  MessageSquare,
  Check,
  CheckCheck,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react';
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
    reactedBy: 'You responded:',
    quickReply: 'Write quick reply...',
    sendReply: 'Send Reply',
    replyPlaceholder: 'Type a message to administration...',
    toastTitle: 'Reaction Submitted',
    toastMsg: 'Your response was transmitted to Hospital Executive Administration.',
  },
  om: {
    title: "Beeksisa fi Ergaa Hatattamaa Bulchiinsaa",
    empty: 'Yeroo ammaa kanatti beeksisni haaraan hin jiru.',
    all: 'Hunda',
    unread: 'Kan Hin Dubbifamin',
    clearAll: 'Hunda Haaqi',
    sender: 'Kallattii:',
    reactedBy: 'Deebii keessan:',
    quickReply: 'Deebii gabaabaa barreessi...',
    sendReply: 'Ergi',
    replyPlaceholder: 'Ergaa bulchiinsaaf qabdan asitti barreessaa...',
    toastTitle: 'Deebiin Keessan Ergameera',
    toastMsg: 'Deebiin keessan kallattiin Bulchiinsa Olaanaa Hospitaalaaf qaqqabeera.',
  },
  am: {
    title: 'የሆስፒታል አስተዳደር አስቸኳይ ማሳወቂያዎች',
    empty: 'በአሁኑ ሰዓት ምንም ማሳወቂያ የለም።',
    all: 'ሁሉም',
    unread: 'ያልተነበቡ',
    clearAll: 'ሁሉንም አጽዳ',
    sender: 'ከ:',
    reactedBy: 'ምላሽዎ:',
    quickReply: 'አጭር ምላሽ ይፃፉ...',
    sendReply: 'ላክ',
    replyPlaceholder: 'ለሆስፒታሉ አስተዳደር መልዕክት እዚህ ይፃፉ...',
    toastTitle: 'ምላሽዎ ተልኳል',
    toastMsg: 'የሰጡት ምላሽ በቀጥታ ለሆስፒታል ስራ አመራር ደርሷል።',
  },
};

export function NotificationBell({ variant = 'dark', className = '' }: NotificationBellProps): React.ReactElement {
  const { user } = useAuth();
  const { language } = useTranslation();
  const lang: Language = (language as Language) || 'en';
  const txt = BELL_I18N[lang] || BELL_I18N.en;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<HospitalNotification[]>([]);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load notifications for this role
  const refreshNotifications = () => {
    if (user) {
      const userNotifications = getNotificationsForUser(user.role, user.patientId?.toString());
      setItems(userNotifications);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setReplyOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;
  const filteredItems = activeTab === 'unread' ? items.filter((n) => !n.read) : items;

  const formatTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  // React to notification
  const handleReact = (
    notifId: string,
    reactionType: ReactionType,
    label: { en: string; om: string; am: string },
  ) => {
    reactToNotification(notifId, {
      type: reactionType,
      label,
      responderName: user?.fullName || user?.username || 'Clinician',
      responderRole: user?.role || 'doctor',
    });

    notifications.show({
      title: txt.toastTitle,
      message: `${txt.toastMsg} (${label[lang] || label.en})`,
      color: 'teal',
    });

    refreshNotifications();
  };

  // Send quick custom reply
  const handleSendReply = (notifId: string) => {
    if (!replyText.trim()) return;

    reactToNotification(notifId, {
      type: 'custom_reply',
      label: {
        en: `Reply: "${replyText.trim()}"`,
        om: `Deebii: "${replyText.trim()}"`,
        am: `ምላሽ: "${replyText.trim()}"`,
      },
      responderName: user?.fullName || user?.username || 'Clinician',
      responderRole: user?.role || 'doctor',
    });

    notifications.show({
      title: txt.toastTitle,
      message: txt.toastMsg,
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
        className={`relative flex items-center justify-center h-8.5 w-8.5 rounded-lg transition-colors cursor-pointer ${
          variant === 'light'
            ? 'border border-slate-200 bg-white hover:border-teal-400 text-slate-700 hover:text-teal-900 shadow-xs'
            : 'border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-teal-300 hover:text-white shadow-xs'
        }`}
      >
        <Bell className="h-4 w-4" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-mono font-bold text-white shadow-sm ring-1 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Downward Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-400" />
              <div>
                <h3 className="text-xs font-bold leading-tight tracking-tight">
                  {txt.title}
                </h3>
                <span className="text-[10px] text-teal-300">
                  {unreadCount > 0 ? `${unreadCount} ${txt.unread}` : 'All caught up'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Bar & Clear Actions */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {txt.all} ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
                className="text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                {txt.clearAll}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-teal-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{txt.empty}</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const titleStr = item.title[lang] || item.title.en;
                const msgStr = item.message[lang] || item.message.en;
                const timeAgo = formatTimeAgo(item.timestamp);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition-colors ${
                      item.read
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-teal-50/40 dark:bg-teal-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.type === 'code_blue' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-800 dark:text-rose-300 uppercase">
                            <AlertOctagon className="h-3 w-3" /> CODE BLUE
                          </span>
                        )}
                        {item.type === 'urgent_rx' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-800 dark:text-purple-300 uppercase">
                            <Pill className="h-3 w-3" /> URGENT RX
                          </span>
                        )}
                        {item.type === 'directive' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-800 dark:text-teal-300 uppercase">
                            <ClipboardCheck className="h-3 w-3" /> DIRECTIVE
                          </span>
                        )}
                        {item.type === 'broadcast' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 uppercase">
                            <Radio className="h-3 w-3" /> BROADCAST
                          </span>
                        )}
                        {item.type === 'custom' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-800 dark:text-blue-300 uppercase">
                            <MessageSquare className="h-3 w-3" /> MESSAGE
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

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {titleStr}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {msgStr}
                    </p>

                    {/* Reaction status if already responded */}
                    {item.reaction ? (
                      <div className="mt-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-2 text-[11px] text-teal-900 dark:text-teal-300 font-semibold flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCheck className="h-3.5 w-3.5 text-teal-600" />
                          <span>{txt.reactedBy} {item.reaction.label[lang] || item.reaction.label.en}</span>
                        </span>
                        <span className="text-[10px] text-teal-700 dark:text-teal-400 font-normal">
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
                                  en: 'On My Way! (Arriving <2m)',
                                  om: 'Deemaan Jira! (<2m)',
                                  am: 'አሁን እየመጣሁ ነው (<2 ደቂቃ)',
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                            >
                              <Clock className="h-3 w-3" />
                              <span>On My Way</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleReact(item.id, 'at_bedside', {
                                  en: 'At Bedside Resuscitation',
                                  om: 'Siree Tasaa Biran Jira',
                                  am: 'አልጋው አጠገብ ደርሻለሁ',
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              <span>At Bedside</span>
                            </button>
                          </>
                        )}

                        {item.type === 'urgent_rx' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleReact(item.id, 'dispensed', {
                                  en: 'Dispensed & Ready',
                                  om: 'Kennameera / Qophiidha',
                                  am: 'ታድሏል / ዝግጁ ሆኗል',
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              <span>Dispensed & Ready</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleReact(item.id, 'in_progress', {
                                  en: 'In Preparation',
                                  om: "Qophaa'aa Jira",
                                  am: 'በመዘጋጀት ላይ ነው',
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                            >
                              <Clock className="h-3 w-3" />
                              <span>In Prep</span>
                            </button>
                          </>
                        )}

                        {(item.type === 'directive' || item.type === 'broadcast') && (
                          <button
                            type="button"
                            onClick={() =>
                              handleReact(item.id, 'acknowledged', {
                                en: 'Acknowledged & Noted',
                                om: 'Hubadheera, Hojiirra Ooleera',
                                am: 'ተረድቻለሁ፣ ተፈፅሟል',
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                          >
                            <CheckCheck className="h-3 w-3" />
                            <span>Acknowledge</span>
                          </button>
                        )}

                        {/* Quick Reply Trigger */}
                        <button
                          type="button"
                          onClick={() => setReplyOpenId(replyOpenId === item.id ? null : item.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium px-2 py-1 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    )}

                    {/* Quick Reply Form */}
                    {replyOpenId === item.id && (
                      <div className="mt-2.5 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={txt.replyPlaceholder}
                          className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReplyOpenId(null)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReply(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            <span>{txt.sendReply}</span>
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
