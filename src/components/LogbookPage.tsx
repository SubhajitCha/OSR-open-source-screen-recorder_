import React, { useState, useEffect, useMemo } from 'react';
import {
  Alert01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  Download01Icon,
  Copy01Icon,
  Search01Icon,
  RotateRight01Icon,
  Bug01Icon,
  Tick01Icon,
  ArrowRight01Icon,
  Folder01Icon,
  CodeIcon,
} from 'hugeicons-react';
import { logbook, LogEntry, LogLevel } from '../services/logbook';

interface LogbookPageProps {
  onBackToStudio: () => void;
}

export const LogbookPage: React.FC<LogbookPageProps> = ({ onBackToStudio }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = logbook.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedLevel !== 'all' && log.level !== selectedLevel) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msgMatch = log.message.toLowerCase().includes(q);
        const digestMatch = log.digest?.toLowerCase().includes(q) || false;
        const categoryMatch = log.category.toLowerCase().includes(q);
        return msgMatch || digestMatch || categoryMatch;
      }
      return true;
    });
  }, [logs, selectedLevel, searchQuery]);

  const stats = useMemo(() => {
    const errorCount = logs.filter((l) => l.level === 'error').length;
    const warnCount = logs.filter((l) => l.level === 'warn').length;
    const infoCount = logs.filter((l) => l.level === 'info' || l.level === 'pipeline').length;
    return { errorCount, warnCount, infoCount, total: logs.length };
  }, [logs]);

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osr_logbook_session_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const summary = logs
      .map(
        (l) =>
          `[${l.timeString}] [${l.level.toUpperCase()}] [${l.category}] ${l.message} ${
            l.digest ? `\n   ↳ Digest: ${l.digest}` : ''
          }${l.stack ? `\n   ↳ Stack: ${l.stack}` : ''}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulateError = () => {
    try {
      throw new Error('Test Diagnostic Error: Simulating unhandled exception to verify inspect observer.');
    } catch (e: any) {
      logbook.addLog('error', 'runtime', e.message, {
        stack: e.stack,
        digest: 'Triggered from Logbook diagnostic test trigger to verify real-time session persistence.',
      });
    }
  };

  return (
    <div id="logbook-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Session Logbook & Browser Error Observer</span>
              <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-zinc-900 text-blue-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-zinc-800">
                Session Storage Active
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Passively intercepts <code className="text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-900 px-1 py-0.5 rounded">console.error</code>, runtime exceptions, rejected promises, and WebRTC/MediaStream events. Retains logs across page reloads until the tab is closed.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleSimulateError}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-900/50 rounded-full transition-all cursor-pointer"
            title="Fire a test error to see real-time digestion"
          >
            <Bug01Icon className="w-3.5 h-3.5" />
            <span>Test Error</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-full transition-all cursor-pointer"
          >
            {isCopied ? <Tick01Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy01Icon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
            <span>{isCopied ? 'Copied' : 'Copy All'}</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-full transition-all cursor-pointer"
          >
            <Download01Icon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => logbook.clearLogs()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200/80 dark:border-red-900/50 rounded-full transition-all cursor-pointer"
          >
            <Delete02Icon className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Stats and Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedLevel('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedLevel === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-sm'
              : 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Total Events</span>
          <span className="text-xl font-mono font-bold">{stats.total}</span>
        </button>

        <button
          onClick={() => setSelectedLevel('error')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedLevel === 'error'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-red-500 dark:text-red-400">Errors & Exceptions</span>
          <span className={`text-xl font-mono font-bold ${selectedLevel === 'error' ? 'text-white' : 'text-red-600 dark:text-red-400'}`}>
            {stats.errorCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevel('warn')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedLevel === 'warn'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-amber-500 dark:text-amber-400">Warnings</span>
          <span className={`text-xl font-mono font-bold ${selectedLevel === 'warn' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
            {stats.warnCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevel('info')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedLevel === 'info'
              ? 'bg-blue-600 dark:bg-emerald-500 text-white dark:text-black border-blue-600 dark:border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-blue-500 dark:text-emerald-400">Info & Pipeline</span>
          <span className={`text-xl font-mono font-bold ${selectedLevel === 'info' ? 'text-white dark:text-black' : 'text-blue-600 dark:text-emerald-400'}`}>
            {stats.infoCount}
          </span>
        </button>
      </div>

      {/* Main Content: Search + Log Viewer + Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Main: Log Feed */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search01Icon className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs by message, exception keyword, digest, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-emerald-500/20 focus:border-blue-500 dark:focus:border-emerald-500"
            />
          </div>

          {/* Logs List Container */}
          <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-colors">
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
              <span>Captured Events ({filteredLogs.length})</span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">Auto-persisted in sessionStorage</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 max-h-[600px] overflow-y-auto font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-zinc-500 font-sans">
                  <CheckmarkCircle01Icon className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">No matching logs found</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Application is running smoothly without recorded exceptions matching this filter.</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-zinc-900 border-l-4 border-l-blue-600 dark:border-l-emerald-400'
                          : log.level === 'error'
                          ? 'hover:bg-red-50/40 dark:hover:bg-red-950/20 bg-white dark:bg-zinc-950'
                          : log.level === 'warn'
                          ? 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20 bg-white dark:bg-zinc-950'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              log.level === 'error'
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                                : log.level === 'warn'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                                : 'bg-blue-100 dark:bg-zinc-800 text-blue-700 dark:text-emerald-400'
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase">{log.category}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{log.timeString}</span>
                      </div>

                      {/* Log Message */}
                      <p className="text-xs text-slate-900 dark:text-zinc-200 font-sans font-medium line-clamp-2 leading-relaxed">
                        {log.message}
                      </p>

                      {/* Digest Pill if available */}
                      {log.digest && (
                        <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800 text-[11px] font-sans text-slate-600 dark:text-zinc-300">
                          <span className="text-blue-600 dark:text-emerald-400 font-bold shrink-0">↳ Digest:</span>
                          <span className="line-clamp-2 leading-tight">{log.digest}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Detailed Inspector Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4 sticky top-6 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CodeIcon className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Inspect Payload & Stack Trace
                </h3>
              </div>
              {selectedLog && (
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">ID: {selectedLog.id}</span>
              )}
            </div>

            {selectedLog ? (
              <div className="space-y-4 text-xs font-sans">
                {/* Level & Timestamp */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Severity Level:</span>
                    <span
                      className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded-full ${
                        selectedLog.level === 'error'
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                          : selectedLog.level === 'warn'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-blue-100 dark:bg-zinc-800 text-blue-700 dark:text-emerald-400'
                      }`}
                    >
                      {selectedLog.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                    <span className="text-slate-500 dark:text-zinc-400">Captured At:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">{selectedLog.timeString} ({new Date(selectedLog.timestamp).toLocaleDateString()})</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                    <span className="text-slate-500 dark:text-zinc-400">Category:</span>
                    <span className="font-mono font-bold capitalize text-slate-800 dark:text-zinc-200">{selectedLog.category}</span>
                  </div>
                </div>

                {/* Human-readable Error Digest */}
                {selectedLog.digest && (
                  <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800 text-blue-900 dark:text-zinc-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-emerald-400 block">
                      Digest & Diagnostic Assessment
                    </span>
                    <p className="text-xs leading-relaxed">{selectedLog.digest}</p>
                  </div>
                )}

                {/* Full Message */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                    Raw Message
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-900 dark:bg-black text-slate-100 dark:text-zinc-200 border border-transparent dark:border-zinc-800 font-mono text-xs overflow-x-auto select-all max-h-36">
                    {selectedLog.message}
                  </div>
                </div>

                {/* Stack Trace if available */}
                {selectedLog.stack && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                      Call Stack Trace
                    </span>
                    <pre className="p-3 rounded-2xl bg-slate-950 dark:bg-black text-emerald-400 font-mono text-[11px] overflow-x-auto select-all max-h-48 whitespace-pre-wrap leading-tight border border-transparent dark:border-zinc-800">
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}

                {/* Captured Payload Data */}
                {selectedLog.data && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                      Inspect Element Data Object
                    </span>
                    <pre className="p-3 rounded-2xl bg-slate-900 dark:bg-black text-blue-300 dark:text-emerald-400 font-mono text-[11px] overflow-x-auto select-all max-h-40 border border-transparent dark:border-zinc-800">
                      {typeof selectedLog.data === 'object'
                        ? JSON.stringify(selectedLog.data, null, 2)
                        : String(selectedLog.data)}
                    </pre>
                  </div>
                )}

                {/* Runtime Context */}
                {selectedLog.context && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1 text-[11px] text-slate-600 dark:text-zinc-400">
                    <span className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">App Runtime State</span>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 break-all space-y-0.5">
                      <div>User Agent: {selectedLog.context.userAgent?.slice(0, 75)}...</div>
                      <div>URL: {selectedLog.context.url}</div>
                      {selectedLog.context.recordingState && (
                        <div>State: {selectedLog.context.recordingState}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-zinc-500">
                <InformationCircleIcon className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                <p className="text-xs">Click any event from the log stream on the left to inspect its parameters, stack trace, and digest.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
