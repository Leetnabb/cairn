import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from './stores/useStore';
import { useAIStore } from './stores/useAIStore';
// useOnboardingStore auto-opens wizard via its own init logic
import { Roadmap } from './components/roadmap/Roadmap';
import { DetailPanel } from './components/detail/DetailPanel';
import { Dashboard } from './components/dashboard/Dashboard';
import { CapabilityLandscape } from './components/capabilities/CapabilityLandscape';
import { CapabilityOverlay } from './components/capabilities/CapabilityOverlay';
import { AddModal } from './components/modals/AddModal';
import { ImportModal } from './components/modals/ImportModal';
import { PresentationMode } from './components/presentation/PresentationMode';
import MeetingMode from './components/meeting/MeetingMode';
import AIChatPanel from './components/ai/AIChatPanel';
import { CairnMark } from './components/CairnLogo';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { HeaderMenu } from './components/header/HeaderMenu';
import { ScenarioDropdown } from './components/header/ScenarioDropdown';
import { InsightsBadge } from './components/header/InsightsBadge';
import { FilterDropdown } from './components/header/FilterDropdown';
import { UndoRedoButtons } from './components/header/UndoRedoButtons';
import { UserMenu } from './components/header/UserMenu';
import { PresentationMenu } from './components/header/PresentationMenu';
import { BoardView } from './components/board/BoardView';
import { SettingsModal } from './components/settings/SettingsModal';
import { LocalStorageMigration } from './components/settings/LocalStorageMigration';
import { useAuth } from './providers/AuthProvider';
import { useComplexityLevel } from './hooks/useComplexityLevel';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useMode } from './hooks/useMode';

export default function App() {
  const { t } = useTranslation();
  const view = useStore(s => s.ui.view);
  const presentationMode = useStore(s => s.ui.presentationMode);
  const meetingMode = useStore(s => s.ui.meetingMode);
  const addModalOpen = useStore(s => s.ui.addModalOpen);
  const importModalOpen = useStore(s => s.ui.importModalOpen);
  const setView = useStore(s => s.setView);
  const setAddModalOpen = useStore(s => s.setAddModalOpen);
  const selectedItem = useStore(s => s.ui.selectedItem);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const aiPanelOpen = useAIStore(s => s.panelOpen);
  const setAIPanelOpen = useAIStore(s => s.setPanelOpen);
  const capabilityOverlayOpen = useStore(s => s.ui.capabilityOverlayOpen);
  const roleMode = useStore(s => s.ui.roleMode);
  const settingsOpen = useStore(s => s.ui.settingsOpen);
  const setSettingsOpen = useStore(s => s.setSettingsOpen);
  const auth = useAuth();
  const isBoardUser = auth.isAuthenticated && auth.role === 'BOARD';
  const { isViewVisible } = useComplexityLevel();
  useSupabaseSync();

  const { mode, transitioning, exitBoardView } = useMode();

  // Auto-show wizard is handled in onboarding store initialization

  // Redirect to roadmap if active view is invalid
  useEffect(() => {
    if (!['roadmap', 'capabilities', 'dashboard'].includes(view)) setView('roadmap');
  }, [view, setView]);

  // Global undo/redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useStore.temporal.getState().undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        useStore.temporal.getState().redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (presentationMode && !isBoardUser) {
    return <PresentationMode />;
  }

  // BOARD role users are restricted to Board View only — no app access
  if (isBoardUser) {
    return <BoardView />;
  }

  const showDetailPanel = selectedItem !== null || aiPanelOpen;

  // Board mode: simplified header + board layout
  if (mode === 'board') {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-bg text-text-primary">
        {/* Board View header */}
        <header
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ minHeight: 52, background: 'var(--bg-header)', borderColor: 'var(--border-default)' }}
        >
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <CairnMark size={0.45} />
          </div>

          {/* Centre: Org name + Board View label */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-secondary font-medium">Board View</span>
          </div>

          {/* Right: Exit link */}
          <button
            onClick={exitBoardView}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('board.exit', 'Exit Board View')}
          </button>
        </header>

        {/* Board content canvas */}
        <div className={`app-canvas flex-1 flex overflow-hidden ${transitioning ? 'transitioning' : ''}`}>
          <BoardView />
        </div>

        {meetingMode && <MeetingMode />}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg text-text-primary">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0"
        style={{ minHeight: 52, background: 'var(--bg-header)' }}
      >
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <CairnMark size={0.45} />
          <span className="text-[18px] font-serif font-normal text-primary tracking-tight">Cairn</span>
          <span className="text-[10px] text-text-tertiary">{t('app.tagline')}</span>
        </Link>

        {/* Center: Scenario dropdown */}
        <ScenarioDropdown />

        {/* Right: Nav + actions */}
        <nav className="flex items-center gap-1">
          <NavBtn active={view === 'roadmap'} onClick={() => setView('roadmap')}>{t('nav.roadmap')}</NavBtn>
          {isViewVisible('capabilities') && (
            <NavBtn active={view === 'capabilities'} onClick={() => setView('capabilities')}>{t('nav.capabilities')}</NavBtn>
          )}
          <NavBtn active={view === 'dashboard'} onClick={() => setView('dashboard')}>{t('nav.dashboard')}</NavBtn>
          <PresentationMenu />
          <div className="w-px h-5 bg-border mx-0.5" />
          {view === 'roadmap' && <FilterDropdown />}
          <InsightsBadge />
          {roleMode === 'work' && (
            <ActionBtn onClick={() => setAddModalOpen(true)}>{t('nav.addNew')}</ActionBtn>
          )}
          <HeaderMenu />
          {roleMode === 'work' && <UndoRedoButtons />}
          <ToggleBtn active={aiPanelOpen} onClick={() => setAIPanelOpen(!aiPanelOpen)}>AI</ToggleBtn>
          <div className="w-px h-5 bg-border mx-0.5" />
          <UserMenu />
        </nav>
      </header>

      {/* Main content */}
      <div className={`app-canvas flex-1 flex overflow-hidden ${transitioning ? 'transitioning' : ''}`}>
        {view === 'dashboard' ? (
          <Dashboard />
        ) : view === 'capabilities' ? (
          <>
            <main className="flex-1 overflow-auto">
              <CapabilityLandscape />
            </main>
            {showDetailPanel && (
              <aside className="shrink-0 border-l border-border w-[320px] overflow-hidden transition-all duration-200" style={{ background: 'var(--bg-panel)' }}>
                <div className="flex h-full">
                  <button onClick={() => setSelectedItem(null)} className="w-5 shrink-0 flex items-center justify-center border-r border-border hover:bg-[var(--bg-hover)] transition-colors" title={t('common.close')}>
                    <span className="text-xs text-text-secondary">&raquo;</span>
                  </button>
                  <div className="flex-1 overflow-y-auto">
                    {aiPanelOpen ? <AIChatPanel /> : <DetailPanel />}
                  </div>
                </div>
              </aside>
            )}
          </>
        ) : (
          <>
            {/* Center - Roadmap (full width) */}
            <main
              className="flex-1 h-full overflow-auto transition-all duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedItem(null);
              }}
            >
              <Roadmap />
            </main>

            {/* Right sidebar - Detail Panel (only when item selected or AI open) */}
            {showDetailPanel && (
              <aside className="shrink-0 border-l border-border w-[320px] overflow-hidden transition-all duration-200 animate-slide-in-right" style={{ background: 'var(--bg-panel)' }}>
                <div className="flex h-full">
                  <button onClick={() => { setSelectedItem(null); setAIPanelOpen(false); }} className="w-5 shrink-0 flex items-center justify-center border-r border-border hover:bg-[var(--bg-hover)] transition-colors" title={t('common.close')}>
                    <span className="text-xs text-text-secondary">&raquo;</span>
                  </button>
                  <div className="flex-1 overflow-y-auto">
                    {aiPanelOpen ? <AIChatPanel /> : <DetailPanel />}
                  </div>
                </div>
              </aside>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-1 text-center text-[9px] text-text-tertiary border-t border-border" style={{ background: 'var(--bg-header)' }}>
        {t('app.footer')}
      </footer>

      {/* Meeting Mode overlay */}
      {meetingMode && <MeetingMode />}

      {/* Capability Overlay */}
      {capabilityOverlayOpen && <CapabilityOverlay />}

      {/* Modals */}
      {addModalOpen && <AddModal />}
      {importModalOpen && <ImportModal />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <OnboardingWizard />
      <LocalStorageMigration />
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[11px] font-medium rounded transition-all duration-150 ${
        active
          ? 'bg-primary text-white active:bg-primary-dark'
          : 'text-text-secondary hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]'
      }`}
    >
      {children}
    </button>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[10px] font-medium rounded border transition-all duration-150 ${
        active
          ? 'border-primary bg-primary/10 text-primary active:bg-primary/20'
          : 'border-border text-text-tertiary hover:border-border-medium active:bg-[var(--bg-hover)]'
      }`}
    >
      {children}
    </button>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-[10px] font-medium text-text-secondary hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] rounded transition-all duration-150"
    >
      {children}
    </button>
  );
}
