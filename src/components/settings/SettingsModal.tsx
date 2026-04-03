import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OrganisationTab } from './OrganisationTab';
import { TeamTab } from './TeamTab';
import { PlanTab } from './PlanTab';
import { DataTab } from './DataTab';
import { StrategicFrameEditor } from '../strategic-frame/StrategicFrameEditor';

interface Props {
  onClose: () => void;
}

type Tab = 'organisation' | 'team' | 'plan' | 'data' | 'strategicFrame';

export function SettingsModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('organisation');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'organisation', label: t('settings.tabs.organisation') },
    { key: 'team', label: t('settings.tabs.team') },
    { key: 'plan', label: t('settings.tabs.plan') },
    { key: 'data', label: t('settings.tabs.data') },
    { key: 'strategicFrame', label: t('settings.tabs.strategicFrame') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[14px] font-semibold text-text-primary">
            {t('settings.title')}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:bg-[var(--bg-hover)] rounded transition-colors text-[16px]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2.5 text-[11px] font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'organisation' && <OrganisationTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'plan' && <PlanTab />}
          {activeTab === 'data' && <DataTab onClose={onClose} />}
          {activeTab === 'strategicFrame' && <StrategicFrameEditor />}
        </div>
      </div>
    </div>
  );
}
