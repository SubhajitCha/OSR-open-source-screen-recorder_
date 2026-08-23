import { ActiveView } from '../types';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'pipeline';

export interface LogEntry {
  id: string;
  timestamp: number;
  timeString: string;
  level: LogLevel;
  category: 'runtime' | 'console' | 'media' | 'storage' | 'network' | 'unhandled';
  message: string;
  digest?: string;
  stack?: string;
  data?: any;
  context?: {
    url?: string;
    userAgent?: string;
    recordingState?: string;
    activeView?: ActiveView;
    resolution?: string;
    codec?: string;
  };
}

const SESSION_STORAGE_KEY = 'osr_runtime_logbook_v1';
const MAX_LOGS = 500;

class LogbookManager {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private isInitialized = false;
  private currentContext: Record<string, any> = {};

  constructor() {
    this.loadFromSessionStorage();
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.attachGlobalErrorHandlers();
    this.interceptConsole();
    this.logSystemStartup();
  }

  public updateContext(ctx: Record<string, any>) {
    this.currentContext = { ...this.currentContext, ...ctx };
  }

  private loadFromSessionStorage() {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse sessionStorage logs:', e);
      this.logs = [];
    }
  }

  private persist() {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
    } catch (e) {
      // If quota exceeded, slice older logs
      try {
        this.logs = this.logs.slice(-100);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.logs));
      } catch {
        // ignore
      }
    }
  }

  private notify() {
    this.persist();
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  public subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.logs]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    this.addLog('info', 'storage', 'Logbook cleared by user gesture');
  }

  public addLog(
    level: LogLevel,
    category: LogEntry['category'],
    message: string,
    details?: { digest?: string; stack?: string; data?: any }
  ) {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    // Auto-digest common web media errors if not provided
    let autoDigest = details?.digest;
    if (!autoDigest) {
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        autoDigest = 'Permission rejected or screen picker dialog was dismissed by user.';
      } else if (message.includes('OverconstrainedError')) {
        autoDigest = 'The requested video resolution or frame rate is not supported by this hardware device.';
      } else if (message.includes('InvalidStateError')) {
        autoDigest = 'MediaRecorder or Canvas stream in an invalid operational state.';
      } else if (message.includes('NotFoundError') || message.includes('DevicesNotFoundError')) {
        autoDigest = 'No matching camera or microphone device was detected on the system.';
      } else if (message.includes('AbortError')) {
        autoDigest = 'Media acquisition process aborted by browser or hardware pipeline.';
      }
    }

    const entry: LogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now(),
      timeString,
      level,
      category,
      message,
      digest: autoDigest,
      stack: details?.stack,
      data: details?.data,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...this.currentContext,
      },
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }
    this.notify();
  }

  private logSystemStartup() {
    this.addLog('info', 'runtime', 'App session initialized. Observing browser console, unhandled exceptions, and MediaStreams.', {
      digest: 'Session storage buffer active — logs persist through page refreshes until tab is closed.',
    });
  }

  private attachGlobalErrorHandlers() {
    // Catch uncaught JS runtime exceptions
    window.addEventListener('error', (event) => {
      const msg = event.message || (typeof event.error === 'string' ? event.error : 'Uncaught Exception');
      const stack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`;

      let digest = 'An unhandled JavaScript runtime error was intercepted by window.onerror.';
      if (msg.includes('Script error')) {
        digest = 'Cross-origin script error. Detailed message restricted by browser CORS security.';
      }

      this.addLog('error', 'unhandled', msg, {
        stack,
        digest,
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Catch unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let msg = 'Unhandled Promise Rejection';
      let stack = '';
      let data: any = null;

      if (reason instanceof Error) {
        msg = reason.message;
        stack = reason.stack || '';
        data = { name: reason.name };
      } else if (typeof reason === 'string') {
        msg = reason;
      } else {
        try {
          msg = JSON.stringify(reason);
        } catch {
          msg = String(reason);
        }
      }

      this.addLog('error', 'unhandled', `Unhandled Rejection: ${msg}`, {
        stack,
        digest: 'An asynchronous operation failed without a catch() block.',
        data,
      });
    });
  }

  private interceptConsole() {
    const originalError = console.error.bind(console);
    const originalWarn = console.warn.bind(console);

    console.error = (...args: any[]) => {
      originalError(...args);
      try {
        const formatted = args
          .map((arg) => (typeof arg === 'object' ? safeStringify(arg) : String(arg)))
          .join(' ');
        
        // Skip noise if desired or log directly
        this.addLog('error', 'console', formatted, {
          data: args.length === 1 && typeof args[0] === 'object' ? args[0] : args,
        });
      } catch {
        // ignore
      }
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      try {
        const formatted = args
          .map((arg) => (typeof arg === 'object' ? safeStringify(arg) : String(arg)))
          .join(' ');
        
        // Don't duplicate benign HMR websocket warnings
        if (formatted.includes('failed to connect to websocket')) return;

        this.addLog('warn', 'console', formatted, {
          data: args.length === 1 && typeof args[0] === 'object' ? args[0] : args,
        });
      } catch {
        // ignore
      }
    };
  }
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, getCircularReplacer(), 2);
  } catch {
    return String(obj);
  }
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

export const logbook = new LogbookManager();
