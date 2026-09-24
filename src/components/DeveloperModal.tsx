import React, { useState } from 'react';
import {
  X,
  Code2,
  Activity,
  Layers,
  Download,
  Terminal,
  Smartphone
} from 'lucide-react';
import { CodeProjectExplorer } from './CodeProjectExplorer';
import { AudioEngineDashboard } from './AudioEngineDashboard';
import { ArchitectureGuide } from './ArchitectureGuide';
import { HardwareTelemetry } from '../types';
import { generateAndroidProjectZip } from '../utils/zipExport';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: HardwareTelemetry;
  isCallActive: boolean;
  callDurationSeconds: number;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  isCallActive,
  callDurationSeconds,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'telemetry' | 'architecture'>('code');
  const [isExportingZip, setIsExportingZip] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      const zipBlob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Android-VoiceCall-Translation-Kotlin.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">
                Android 14 Developer Tools &amp; Codebase
              </h2>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Production Kotlin, Ktor WebSockets, Audio HAL &amp; Jetpack Compose architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Export Button */}
            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isExportingZip ? 'Packaging ZIP...' : 'Export Project (.ZIP)'}
              </span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center px-4 border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto gap-2 flex-shrink-0 py-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === 'code'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Kotlin Codebase</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === 'telemetry'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audio Hardware Engine &amp; VAD</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === 'architecture'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture &amp; Flow</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-neutral-950/30">
          {activeTab === 'code' && <CodeProjectExplorer />}
          {activeTab === 'telemetry' && (
            <AudioEngineDashboard
              telemetry={telemetry}
              isCallActive={isCallActive}
              callDurationSeconds={callDurationSeconds}
            />
          )}
          {activeTab === 'architecture' && <ArchitectureGuide />}
        </div>
      </div>
    </div>
  );
};
