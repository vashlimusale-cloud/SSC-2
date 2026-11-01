import React, { useState, useEffect } from 'react';
import {
  X,
  Laptop,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Cloud,
  Check,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'local'>('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Check if running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const localInstallSteps = [
    {
      title: '1. Install Node.js & Git',
      desc: 'Ensure your laptop has Node.js (v20 or higher) and Git installed.',
      cmd: 'node -v && git --version',
    },
    {
      title: '2. Clone & Install Dependencies',
      desc: 'Open PowerShell or Terminal in your project directory and install the packages:',
      cmd: 'npm install',
    },
    {
      title: '3. Start the System Command Center',
      desc: 'Start the live server with full Express system endpoints and Vite dev tools:',
      cmd: 'npm run dev',
    },
    {
      title: '4. Install & Link rclone for Google Drive (Optional)',
      desc: 'Install rclone via Windows Package Manager (winget) and configure your Google Drive:',
      cmd: 'winget install Rclone.Rclone\nrclone config',
    },
  ];

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl win-card bg-[#161a24] border border-white/20 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Install System Command Center on Your Laptop
              </h2>
              <p className="text-xs text-gray-400">
                Choose between instant 1-click Windows Desktop installation or running locally from source
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close installation guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 bg-white/[0.01] px-5 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pwa'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Method 1: Instant Windows Desktop App (PWA)
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'local'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Method 2: Run Locally (Node.js & rclone CLI)
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-300">
          {activeTab === 'pwa' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Recommended: 1-Click Desktop Installation
                  </div>
                  <p className="text-gray-300 text-xs">
                    Installs directly into Windows 11 as a standalone desktop application. Adds a Start Menu shortcut, taskbar icon, and runs in its own window with global <kbd className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 font-mono">Ctrl+Shift+Space</kbd> hotkey support.
                  </p>
                </div>

                {deferredPrompt ? (
                  <button
                    onClick={handleInstallPWA}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 shadow-lg cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Install Now
                  </button>
                ) : isInstalled ? (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30 shrink-0">
                    Already Installed
                  </span>
                ) : (
                  <div className="text-[11px] text-blue-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10 shrink-0">
                    Use browser address bar icon <Download className="w-3 h-3 inline ml-1" />
                  </div>
                )}
              </div>

              {/* Instructions for Edge / Chrome */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-semibold text-white text-xs">
                  How to install in Microsoft Edge or Google Chrome on Windows:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-300 leading-relaxed">
                  <li>
                    <strong>Look at the address bar</strong> at the top right of your browser:
                    <ul className="list-disc list-inside pl-4 pt-1 text-gray-400 space-y-1">
                      <li>In <strong>Microsoft Edge</strong>: Click the <strong className="text-white">App Available / Install</strong> icon (or menu <kbd>...</kbd> → <strong className="text-white">Apps</strong> → <strong className="text-white">Install this site as an app</strong>).</li>
                      <li>In <strong>Google Chrome</strong>: Click the <strong className="text-white">Install</strong> icon in the omnibox (or menu <kbd>⋮</kbd> → <strong className="text-white">Save and share</strong> → <strong className="text-white">Install page as app...</strong>).</li>
                    </ul>
                  </li>
                  <li>Click <strong className="text-white">Install</strong> in the confirmation prompt.</li>
                  <li>Check <strong className="text-white">Pin to taskbar</strong> and <strong className="text-white">Pin to Start</strong>.</li>
                  <li>The app will launch in its own native window without browser toolbars.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-300 text-xs">
                To run the full stack (including custom Windows API scripts and live rclone CLI) directly on your laptop machine:
              </p>

              {localInstallSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">{step.title}</span>
                    <button
                      onClick={() => copyToClipboard(step.cmd, idx)}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">{step.desc}</p>
                  <pre className="p-2.5 rounded-lg bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-400 overflow-x-auto select-all">
                    {step.cmd}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
          <div className="text-gray-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Safety Policy & Undo journal enabled by default.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
