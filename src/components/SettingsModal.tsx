import React, { useState } from 'react';
import { soundFx } from '../services/soundFx';
import { CurrencySelector } from './CurrencySelector';
import { Volume2, VolumeX, Download, Upload, RotateCcw, X, Check, DollarSign } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSave: () => string;
  onImportSave: (json: string) => boolean;
  onRestartCareer: () => void;
  clubCountry?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onExportSave,
  onImportSave,
  onRestartCareer,
  clubCountry
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());
  const [importText, setImportText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  const handleExport = () => {
    const json = onExportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rugga_27_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = onImportSave(importText.trim());
    if (ok) {
      setImportStatus('Save loaded successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setImportStatus('Invalid save file format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-neutral-100 shadow-2xl animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <h3 className="font-heading font-bold text-base text-white">Simulation & Save Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Display Currency Setting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <div>
              <div className="font-semibold text-neutral-100">Display Currency</div>
              <div className="text-[11px] text-neutral-400">Pound Sterling, Rand, Euro, Dollar or Team Local</div>
            </div>
            <CurrencySelector clubCountry={clubCountry} />
          </div>

          {/* Audio Setting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <div>
              <div className="font-semibold text-neutral-100">Match Audio & Synthesizer</div>
              <div className="text-[11px] text-neutral-400">Ref whistle, boot kicks, tackles & crowd cheering</div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg cursor-pointer ${
                isMuted ? 'bg-red-950/60 text-red-300' : 'bg-emerald-950/60 text-emerald-300'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Backup Save File */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
            <div className="font-semibold text-neutral-100">Save File Management</div>
            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Save (JSON)</span>
              </button>
            </div>

            <textarea
              placeholder="Paste exported save JSON here to restore..."
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-16 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono focus:outline-none focus:border-emerald-500"
            />

            {importText && (
              <button
                onClick={handleImport}
                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Save</span>
              </button>
            )}

            {importStatus && (
              <div className="text-[11px] text-emerald-400 font-semibold text-center">{importStatus}</div>
            )}
          </div>

          {/* Restart Career */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Start a new career? This will reset current season progress.')) {
                  onRestartCareer();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-800/60 text-red-300 font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Career</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
