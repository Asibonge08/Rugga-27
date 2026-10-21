import React, { useState } from 'react';
import { InboxMessage } from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { Mail, CheckCircle2, AlertCircle, Shield, Award, ArrowRight, CheckCheck, ExternalLink } from 'lucide-react';

interface InboxViewProps {
  messages: InboxMessage[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  messages,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateTab
}) => {
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(messages[0] || null);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const filteredMessages = messages.filter(m => {
    if (filter === 'UNREAD') return !m.read;
    return true;
  });

  const unreadTotal = messages.filter(m => !m.read).length;

  const handleSelect = (msg: InboxMessage) => {
    soundFx.playClick();
    setSelectedMessage(msg);
    if (!msg.read) {
      onMarkAsRead(msg.id);
    }
  };

  const handleActionClick = (msg: InboxMessage) => {
    soundFx.playClick();
    if (!msg.read) {
      onMarkAsRead(msg.id);
    }
    if (msg.actionRoute && onNavigateTab) {
      onNavigateTab(msg.actionRoute.screen, msg.actionRoute.targetEntityId);
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-heading font-bold text-lg text-white">Managerial Inbox & News Feed</h2>
              {unreadTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold bg-amber-500 text-neutral-950">
                  {unreadTotal} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">Official club communications, medical updates, and board notifications</p>
          </div>
        </div>

        {/* Filter and Bulk Actions */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => {
                soundFx.playClick();
                setFilter('ALL');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setFilter('UNREAD');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'UNREAD' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Unread ({unreadTotal})
            </button>
          </div>

          {onMarkAllAsRead && unreadTotal > 0 && (
            <button
              onClick={() => {
                soundFx.playClick();
                onMarkAllAsRead();
              }}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              title="Mark all messages as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Message List */}
        <div className="md:col-span-1 rounded-2xl bg-neutral-900 border border-neutral-800 p-3 shadow-xl space-y-1.5 max-h-[65vh] overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center text-neutral-500 text-xs py-8 italic">
              {filter === 'UNREAD' ? 'No unread messages.' : 'Your inbox is empty.'}
            </div>
          ) : (
            filteredMessages.map(msg => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/40'
                      : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <span className="font-medium truncate max-w-[120px]">{msg.sender}</span>
                    <span className="font-mono-numbers">{msg.date}</span>
                  </div>
                  <div className={`text-xs truncate ${!msg.read ? 'font-bold text-white' : 'text-neutral-300'}`}>
                    {!msg.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 shrink-0" />}
                    {msg.subject}
                  </div>
                  {msg.actionRoute && (
                    <div className="mt-1 flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold">
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>{msg.actionRoute.label || 'Action Required'}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Message Detail */}
        <div className="md:col-span-2 rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl flex flex-col justify-between">
          {selectedMessage ? (
            <div>
              <div className="pb-4 border-b border-neutral-800 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 font-mono-numbers">
                    {selectedMessage.category}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono-numbers">
                    {selectedMessage.date}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-white mt-2">
                  {selectedMessage.subject}
                </h3>
                <div className="text-xs text-neutral-400 mt-1">
                  From: <span className="text-neutral-200">{selectedMessage.sender}</span>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                {selectedMessage.body}
              </div>

              {/* Action Deep Link Button */}
              {selectedMessage.actionRoute && (
                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    Quick Navigation Link:
                  </span>
                  <button
                    onClick={() => handleActionClick(selectedMessage)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wide flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-emerald-950/60"
                  >
                    <span>{selectedMessage.actionRoute.label || `Go to ${selectedMessage.actionRoute.screen.toUpperCase()}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-neutral-500 text-xs py-12">
              Select a message from the left to read its contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

