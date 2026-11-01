/**
 * System Command Center - Unified Windows 11 Desktop Application Shell
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemCommandProvider, useSystemCommand } from './context/SystemCommandContext';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { QuickCommandOverlay } from './components/QuickCommandOverlay';
import { ProcessDetailModal } from './components/ProcessDetailModal';
import { ToastNotification } from './components/ToastNotification';
import { FLUENT_EASE } from './components/FluentMotion';

// All 16 Functional Views
import { OverviewView } from './components/views/OverviewView';
import { MyPcView } from './components/views/MyPcView';
import { RunningAppsView } from './components/views/RunningAppsView';
import { BackgroundProcessesView } from './components/views/BackgroundProcessesView';
import { StartupManagerView } from './components/views/StartupManagerView';
import { ServicesView } from './components/views/ServicesView';
import { ResourceMonitorView } from './components/views/ResourceMonitorView';
import { OptimizeView } from './components/views/OptimizeView';
import { NetworkView } from './components/views/NetworkView';
import { StorageAnalyzerView } from './components/views/StorageAnalyzerView';
import { GoogleDriveView } from './components/views/GoogleDriveView';
import { TransfersView } from './components/views/TransfersView';
import { FileOrganizerView } from './components/views/FileOrganizerView';
import { BackupRestoreView } from './components/views/BackupRestoreView';
import { ToolsView } from './components/views/ToolsView';
import { CommandCenterView } from './components/views/CommandCenterView';
import { ActivityHistoryView } from './components/views/ActivityHistoryView';
import { SettingsView } from './components/views/SettingsView';
import { HelpDocsView } from './components/views/HelpDocsView';

const MainContent: React.FC = () => {
  const { activeView } = useSystemCommand();

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView />;
      case 'my_pc':
        return <MyPcView />;
      case 'running_apps':
        return <RunningAppsView />;
      case 'background_processes':
        return <BackgroundProcessesView />;
      case 'startup_manager':
        return <StartupManagerView />;
      case 'services':
        return <ServicesView />;
      case 'resource_monitor':
        return <ResourceMonitorView />;
      case 'optimize':
        return <OptimizeView />;
      case 'network':
        return <NetworkView />;
      case 'storage_analyzer':
        return <StorageAnalyzerView />;
      case 'google_drive':
        return <GoogleDriveView />;
      case 'transfers':
        return <TransfersView />;
      case 'file_organizer':
        return <FileOrganizerView />;
      case 'backup_restore':
        return <BackupRestoreView />;
      case 'tools':
        return <ToolsView />;
      case 'command_center':
        return <CommandCenterView />;
      case 'activity_history':
        return <ActivityHistoryView />;
      case 'settings':
        return <SettingsView />;
      case 'help_docs':
        return <HelpDocsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto px-6 py-4 bg-[#09090b] text-[#f4f4f5]">
      <div className="max-w-[1440px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: FLUENT_EASE }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};

export default function App() {
  return (
    <SystemCommandProvider>
      <div className="h-screen w-screen flex bg-[#09090b] text-[#f4f4f5] font-sans antialiased overflow-hidden select-none">
        {/* Left Full-Height Neo's Noir Sidebar (Reference Image Authority) */}
        <Sidebar />

        {/* Right Workspace Column: Top Header + Main Bento Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TitleBar />
          <MainContent />
        </div>

        {/* Global Overlays & Modals */}
        <QuickCommandOverlay />
        <ProcessDetailModal />
        <ToastNotification />
      </div>
    </SystemCommandProvider>
  );
}
