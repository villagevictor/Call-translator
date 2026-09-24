import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Code2,
  FileText,
  FileBox,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { AndroidProjectFile } from '../types';
import { ANDROID_PROJECT_FILES } from '../data/androidFiles';
import { generateAndroidProjectZip } from '../utils/zipExport';

export const CodeProjectExplorer: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(ANDROID_PROJECT_FILES[2].path); // Default to AudioHardwareEngine.kt
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const selectedFile =
    ANDROID_PROJECT_FILES.find((f) => f.path === selectedFilePath) || ANDROID_PROJECT_FILES[0];

  const filteredFiles = ANDROID_PROJECT_FILES.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

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

  const getFileBadgeColor = (category: AndroidProjectFile['category']) => {
    switch (category) {
      case 'Kotlin':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Manifest':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Gradle':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Config':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default:
        return 'text-neutral-400 bg-neutral-800 border-neutral-700';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[780px]">
      {/* Top Header */}
      <div className="p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              Android Production Project Explorer
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                Kotlin 2.0 • Android 14+ (API 34)
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Complete, production-tested Kotlin classes, Ktor WebSockets, Compose UI, and Manifest
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-neutral-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/50 transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingZip ? 'Packaging ZIP...' : 'Download Project (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Tree Explorer on Left, Code Viewer on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Explorer */}
        <div className="w-72 border-r border-neutral-800 bg-neutral-950/50 flex flex-col flex-shrink-0">
          {/* Search Bar */}
          <div className="p-3 border-b border-neutral-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            <div className="text-[10px] font-bold uppercase text-neutral-500 px-2 py-1 tracking-wider">
              Project Structure
            </div>

            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition ${
                    isSelected
                      ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-neutral-500'}`} />
                    <span className="truncate">{file.name}</span>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${getFileBadgeColor(
                      file.category
                    )}`}
                  >
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Info Footer */}
          <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-500 bg-neutral-900/40">
            <span>Ready for Android Studio Ladybug / Koala</span>
          </div>
        </div>

        {/* Right Code Display Area */}
        <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
          {/* File Path Header */}
          <div className="px-4 py-2 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-300 font-mono text-[11px]">
              <span className="text-neutral-500">app /</span>
              <span className="text-indigo-300 font-semibold">{selectedFile.path}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <span>{selectedFile.content.split('\n').length} lines</span>
              <span>•</span>
              <span className="uppercase">{selectedFile.language}</span>
            </div>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-neutral-300 bg-neutral-950 select-text">
            <pre className="flex">
              {/* Line Numbers */}
              <div className="select-none text-neutral-600 text-right pr-4 border-r border-neutral-800 flex-shrink-0">
                {selectedFile.content.split('\n').map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Content */}
              <div className="pl-4 overflow-x-auto flex-1 text-neutral-200">
                {selectedFile.content.split('\n').map((line, i) => (
                  <div key={i} className="leading-6 whitespace-pre">
                    {formatSyntax(line)}
                  </div>
                ))}
              </div>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// Lightweight syntax colorizer for Kotlin, XML, and Gradle
function formatSyntax(line: string): React.ReactNode {
  if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('<!--')) {
    return <span className="text-neutral-500 italic">{line}</span>;
  }
  if (line.trim().startsWith('package') || line.trim().startsWith('import')) {
    return <span className="text-pink-400 font-medium">{line}</span>;
  }
  if (line.includes('class ') || line.includes('interface ') || line.includes('object ')) {
    return <span className="text-yellow-300">{line}</span>;
  }
  if (line.includes('fun ') || line.includes('override fun')) {
    return <span className="text-sky-300">{line}</span>;
  }
  if (line.includes('val ') || line.includes('var ')) {
    return <span className="text-indigo-300">{line}</span>;
  }
  if (line.includes('<uses-permission') || line.includes('<service') || line.includes('<application')) {
    return <span className="text-emerald-300">{line}</span>;
  }
  return <span>{line}</span>;
}
