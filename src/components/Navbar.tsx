import React from 'react';
import {
  Video01Icon,
  Film01Icon,
  BookOpen01Icon,
  Settings01Icon,
  SecurityCheckIcon,
  Activity01Icon,
} from 'hugeicons-react';
import { ActiveView } from '../types';

interface NavbarProps {
  activeView: ActiveView;
  recordingsCount: number;
  onSelectView: (view: ActiveView) => void;
  onOpenSettings: () => void;
  isRecording: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  recordingsCount,
  onSelectView,
  onOpenSettings,
  isRecording,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full h-16 bg-white border-b border-gray-200 transition-all"
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          id="brand-logo-btn"
          onClick={() => !isRecording && onSelectView('studio')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-sm shadow-red-500/20 group-hover:scale-105 transition-transform">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 tracking-tight group-hover:text-red-600 transition-colors">
                Screen Recorder
              </h1>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-gray-100/80 border border-gray-200 rounded-xl">
          <button
            id="nav-tab-studio"
            disabled={isRecording}
            onClick={() => onSelectView('studio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Video01Icon className="w-4 h-4 text-red-500" />
            <span>Studio</span>
          </button>

          <button
            id="nav-tab-library"
            disabled={isRecording}
            onClick={() => onSelectView('library')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'library'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Film01Icon className="w-4 h-4 text-gray-500" />
            <span>Library</span>
            {recordingsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-full">
                {recordingsCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-docs"
            disabled={isRecording}
            onClick={() => onSelectView('docs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'docs'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BookOpen01Icon className="w-4 h-4 text-gray-500" />
            <span>Docs</span>
          </button>
        </nav>

        {/* Right utility elements */}
        <div className="flex items-center gap-3">
          {/* Services Healthy Interactive Button */}
          <button
            id="btn-nav-services-health"
            disabled={isRecording}
            onClick={() => onSelectView('services')}
            title="Click to view all running engine services and system health"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Services: Healthy</span>
          </button>

          {/* Settings button */}
          <button
            id="btn-nav-settings"
            onClick={onOpenSettings}
            title="Recording & Audio Settings"
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer"
          >
            <Settings01Icon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
