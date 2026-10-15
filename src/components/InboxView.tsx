import React, { useState } from 'react';
import { InboxMessage } from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { Mail, CheckCircle2, AlertCircle, Shield, Award } from 'lucide-react';

interface InboxViewProps {
  messages: InboxMessage[];
  onMarkAsRead: (id: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ messages, onMarkAsRead }) => {
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(messages[0] || null);

  const handleSelect = (msg: InboxMessage) => {
    soundFx.playClick();
    setSelectedMessage(msg);
    if (!msg.read) {
      onMarkAsRead(msg.id);
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Managerial Inbox & News Feed</h2>
          <p className="text-xs text-neutral-400">Official club communications, medical reports, and media enquiries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Message List */}
        <div className="md:col-span-1 rounded-2xl bg-neutral-900 border border-neutral-800 p-3 shadow-xl space-y-1.5 max-h-[65vh] overflow-y-auto">
          {messages.map(msg => {
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
                  <span className="font-medium">{msg.sender}</span>
                  <span>{msg.date}</span>
                </div>
                <div className={`text-xs truncate ${!msg.read ? 'font-bold text-white' : 'text-neutral-300'}`}>
                  {!msg.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />}
                  {msg.subject}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Detail */}
        <div className="md:col-span-2 rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl flex flex-col justify-between">
          {selectedMessage ? (
            <div>
              <div className="pb-4 border-b border-neutral-800 mb-4">
                <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 font-mono-numbers">
                  {selectedMessage.category}
                </span>
                <h3 className="font-heading font-bold text-lg text-white mt-2">
                  {selectedMessage.subject}
                </h3>
                <div className="text-xs text-neutral-400 mt-1">
                  From: <span className="text-neutral-200">{selectedMessage.sender}</span> · {selectedMessage.date}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                {selectedMessage.body}
              </div>
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
