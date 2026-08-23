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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Session Logbook & Browser Error Observer</span>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/80">
                Session Storage Active
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Passively intercepts <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">console.error</code>, runtime exceptions, rejected promises, and WebRTC/MediaStream events. Retains logs across page reloads until the tab is closed.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleSimulateError}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-full transition-all cursor-pointer"
            title="Fire a test error to see real-time digestion"
          >
            <Bug01Icon className="w-3.5 h-3.5" />
            <span>Test Error</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-full transition-all cursor-pointer"
          >
            {isCopied ? <Tick01Icon className="w-3.5 h-3.5 text-emerald-600" /> : <Copy01Icon className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isCopied ? 'Copied' : 'Copy All'}</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-full transition-all cursor-pointer"
          >
            <Download01Icon className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => logbook.clearLogs()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-full transition-all cursor-pointer"
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
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-red-500">Errors & Exceptions</span>
          <span className={`text-xl font-mono font-bold ${selectedLevel === 'error' ? 'text-white' : 'text-red-600'}`}>
            {stats.errorCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevel('warn')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedLevel === 'warn'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-amber-500">Warnings</span>
          <span className={`text-xl font-mono font-bold ${selectedLevel === 'warn' ? 'text-white' : 'text-amber-600'}`}>
            {stats.warnCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevel('info')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedLevel === 'info'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-blue-500">Info & Pipeline</span>
          <span className={`text-xl font-mono font-bold ${selectedLevel === 'info' ? 'text-white' : 'text-blue-600'}`}>
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
            <Search01Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs by message, exception keyword, digest, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Logs List Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Captured Events ({filteredLogs.length})</span>
              <span className="text-[11px] font-mono text-slate-400">Auto-persisted in sessionStorage</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-sans">
                  <CheckmarkCircle01Icon className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 text-sm">No matching logs found</p>
                  <p className="text-xs text-slate-400 mt-1">Application is running smoothly without recorded exceptions matching this filter.</p>
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
                          ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                          : log.level === 'error'
                          ? 'hover:bg-red-50/40 bg-white'
                          : log.level === 'warn'
                          ? 'hover:bg-amber-50/40 bg-white'
                          : 'hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              log.level === 'error'
                                ? 'bg-red-100 text-red-700'
                                : log.level === 'warn'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{log.category}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timeString}</span>
                      </div>

                      {/* Log Message */}
                      <p className="text-xs text-slate-900 font-sans font-medium line-clamp-2 leading-relaxed">
                        {log.message}
                      </p>

                      {/* Digest Pill if available */}
                      {log.digest && (
                        <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-sans text-slate-600">
                          <span className="text-blue-600 font-bold shrink-0">↳ Digest:</span>
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
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CodeIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Inspect Payload & Stack Trace
                </h3>
              </div>
              {selectedLog && (
                <span className="text-[10px] font-mono text-slate-400">ID: {selectedLog.id}</span>
              )}
            </div>

            {selectedLog ? (
              <div className="space-y-4 text-xs font-sans">
                {/* Level & Timestamp */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Severity Level:</span>
                    <span
                      className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded-full ${
                        selectedLog.level === 'error'
                          ? 'bg-red-100 text-red-700'
                          : selectedLog.level === 'warn'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {selectedLog.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Captured At:</span>
                    <span className="font-mono font-medium">{selectedLog.timeString} ({new Date(selectedLog.timestamp).toLocaleDateString()})</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-mono font-bold capitalize text-slate-800">{selectedLog.category}</span>
                  </div>
                </div>

                {/* Human-readable Error Digest */}
                {selectedLog.digest && (
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      Digest & Diagnostic Assessment
                    </span>
                    <p className="text-xs leading-relaxed">{selectedLog.digest}</p>
                  </div>
                )}

                {/* Full Message */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Raw Message
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto select-all max-h-36">
                    {selectedLog.message}
                  </div>
                </div>

                {/* Stack Trace if available */}
                {selectedLog.stack && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Call Stack Trace
                    </span>
                    <pre className="p-3 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto select-all max-h-48 whitespace-pre-wrap leading-tight">
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}

                {/* Captured Payload Data */}
                {selectedLog.data && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Inspect Element Data Object
                    </span>
                    <pre className="p-3 rounded-2xl bg-slate-900 text-blue-300 font-mono text-[11px] overflow-x-auto select-all max-h-40">
                      {typeof selectedLog.data === 'object'
                        ? JSON.stringify(selectedLog.data, null, 2)
                        : String(selectedLog.data)}
                    </pre>
                  </div>
                )}

                {/* Runtime Context */}
                {selectedLog.context && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-700 block mb-1">App Runtime State</span>
                    <div className="font-mono text-[10px] text-slate-500 break-all space-y-0.5">
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
              <div className="p-8 text-center text-slate-400">
                <InformationCircleIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Click any event from the log stream on the left to inspect its parameters, stack trace, and digest.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
