import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from './stores/useStore';
import { useAIStore } from './stores/useAIStore';
// useOnboardingStore auto-opens wizard via its own init logic
import { Roadmap } from './components/roadmap/Roadmap';
import { DetailPanel } from './components/detail/DetailPanel';
import { Dashboard } from './components/dashboard/Dashboard';
import { CompareView } from './components/scenarios/CompareView';
import { CapabilityLandscape } from './components/capabilities/CapabilityLandscape';
import { EffectBoard } from './components/effects/EffectBoard';
import { StrategyOverview } from './components/strategies/StrategyOverview';
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
import { RoleModeToggle } from './components/header/RoleModeToggle';
import { UndoRedoButtons } from './components/header/UndoRedoButtons';
import { BoardView } from './components/board/BoardView';
import { SettingsModal } from './components/settings/SettingsModal';
import { LocalStorageMigration } from './components/settings/LocalStorageMigration';
import { useAuth } from './providers/AuthProvider';
import { useComplexityLevel } from './hooks/useComplexityLevel';
import i18n from './i18n';

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
  const enterMeetingMode = useStore(s => s.enterMeetingMode);
  const aiPanelOpen = useAIStore(s => s.panelOpen);
  const setAIPanelOpen = useAIStore(s => s.setPanelOpen);
  const capabilityOverlayOpen = useStore(s => s.ui.capabilityOverlayOpen);
  const roleMode = useStore(s => s.ui.roleMode);
  const boardViewMode = useStore(s => s.ui.boardViewMode);
  const modules = useStore(s => s.modules);
  const settingsOpen = useStore(s => s.ui.settingsOpen);
  const setSettingsOpen = useStore(s => s.setSettingsOpen);
  const auth = useAuth();
  const isBoardUser = auth.isAuthenticated && auth.role === 'BOARD';
  const { isViewVisible } = useComplexityLevel();

  // Auto-show wizard is handled in onboarding store initialization

  // Redirect to roadmap if active view belongs to a disabled module
  useEffect(() => {
    if (view === 'capabilities' && !modules.capabilities) setView('roadmap');
    if (view === 'effects' && !modules.effects) setView('roadmap');
  }, [modules, view, setView]);

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
  if (boardViewMode || isBoardUser) {
    return <BoardView />;
  }

  const showDetailPanel = selectedItem !== null || aiPanelOpen;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-border shrink-0" style={{ minHeight: 48 }}>
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <CairnMark size={0.45} />
          <span className="text-[15px] font-bold text-primary tracking-tight">Cairn</span>
          <span className="text-[10px] text-text-tertiary">{t('app.tagline')}</span>
        </Link>

        {/* Center: Scenario dropdown */}
        <ScenarioDropdown />

        {/* Right: Nav + actions */}
        <nav className="flex items-center gap-1">
          {isViewVisible('strategies') && (
            <NavBtn active={view === 'strategies'} onClick={() => setView('strategies')}>{t('nav.strategies')}</NavBtn>
          )}
          <NavBtn active={view === 'roadmap'} onClick={() => setView('roadmap')}>{t('nav.roadmap')}</NavBtn>
          {modules.capabilities && isViewVisible('capabilities') && (
            <NavBtn active={view === 'capabilities'} onClick={() => setView('capabilities')}>{t('nav.capabilities')}</NavBtn>
          )}
          {modules.effects && isViewVisible('effects') && (
            <NavBtn active={view === 'effects'} onClick={() => setView('effects')}>{t('nav.effects')}</NavBtn>
          )}
          {isViewVisible('compare') && (
            <NavBtn active={view === 'compare'} onClick={() => setView('compare')}>{t('nav.compare')}</NavBtn>
          )}
          <NavBtn active={view === 'dashboard'} onClick={() => setView('dashboard')}>{t('nav.dashboard')}</NavBtn>
          <NavBtn active={false} onClick={() => enterMeetingMode()}>{t('nav.presentation')}</NavBtn>
          <div className="w-px h-5 bg-border mx-0.5" />
          {view === 'roadmap' && <FilterDropdown />}
          <InsightsBadge />
          {roleMode === 'work' && (
            <ActionBtn onClick={() => setAddModalOpen(true)}>{t('nav.addNew')}</ActionBtn>
          )}
          <HeaderMenu />
          {roleMode === 'work' && <UndoRedoButtons />}
          <div className="w-px h-5 bg-border mx-0.5" />
          <RoleModeToggle />
          <ToggleBtn active={aiPanelOpen} onClick={() => setAIPanelOpen(!aiPanelOpen)}>AI</ToggleBtn>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'nb' ? 'en' : 'nb')}
            className="px-2 py-1 text-[10px] font-medium text-text-secondary hover:bg-gray-100 rounded"
          >
            {i18n.language === 'nb' ? 'EN' : 'NB'}
          </button>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {view === 'dashboard' ? (
          <Dashboard />
        ) : view === 'strategies' ? (
          <StrategyOverview />
        ) : view === 'effects' ? (
          <>
            <main className="flex-1 overflow-auto">
              <EffectBoard />
            </main>
            {showDetailPanel && (
              <aside className="shrink-0 border-l border-border bg-white w-[320px] overflow-hidden transition-all duration-200">
                <div className="flex h-full">
                  <button onClick={() => setSelectedItem(null)} className="w-5 shrink-0 flex items-center justify-center border-r border-border hover:bg-gray-100 transition-colors" title={t('common.close')}>
                    <span className="text-xs text-text-secondary">&raquo;</span>
                  </button>
                  <div className="flex-1 overflow-y-auto">
                    {aiPanelOpen ? <AIChatPanel /> : <DetailPanel />}
                  </div>
                </div>
              </aside>
            )}
          </>
        ) : view === 'compare' ? (
          <CompareView />
        ) : view === 'capabilities' ? (
          <>
            <main className="flex-1 overflow-auto">
              <CapabilityLandscape />
            </main>
            {showDetailPanel && (
              <aside className="shrink-0 border-l border-border bg-white w-[320px] overflow-hidden transition-all duration-200">
                <div className="flex h-full">
                  <button onClick={() => setSelectedItem(null)} className="w-5 shrink-0 flex items-center justify-center border-r border-border hover:bg-gray-100 transition-colors" title={t('common.close')}>
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
              <aside className="shrink-0 border-l border-border bg-white w-[320px] overflow-hidden transition-all duration-200 animate-slide-in-right">
                <div className="flex h-full">
                  <button onClick={() => { setSelectedItem(null); setAIPanelOpen(false); }} className="w-5 shrink-0 flex items-center justify-center border-r border-border hover:bg-gray-100 transition-colors" title={t('common.close')}>
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
      <footer className="shrink-0 px-4 py-1 text-center text-[9px] text-text-tertiary border-t border-border bg-white">
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
          : 'text-text-secondary hover:bg-gray-100 active:bg-gray-200'
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
          : 'border-border text-text-tertiary hover:border-gray-300 active:bg-gray-200'
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
      className="px-2 py-1 text-[10px] font-medium text-text-secondary hover:bg-gray-100 active:bg-gray-200 rounded transition-all duration-150"
    >
      {children}
    </button>
  );
}
