import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

const PLAN_DISPLAY = {
  FREE: { label: 'Free', color: 'text-text-secondary bg-gray-100' },
  PRO: { label: 'Pro', color: 'text-blue-700 bg-blue-50' },
  ENTERPRISE: { label: 'Enterprise', color: 'text-indigo-700 bg-indigo-50' },
};

interface LimitRow {
  key: string;
  labelKey: string;
  free: string;
  pro: string;
  enterprise: string;
}

const LIMIT_ROWS: LimitRow[] = [
  { key: 'scenarios', labelKey: 'settings.plan.limits.scenarios', free: '1', pro: '10', enterprise: '∞' },
  { key: 'initiatives', labelKey: 'settings.plan.limits.initiatives', free: '20', pro: '∞', enterprise: '∞' },
  { key: 'capabilities', labelKey: 'settings.plan.limits.capabilities', free: '—', pro: '✓', enterprise: '✓' },
  { key: 'effects', labelKey: 'settings.plan.limits.effects', free: '—', pro: '✓', enterprise: '✓' },
  { key: 'benchmarks', labelKey: 'settings.plan.limits.benchmarks', free: '—', pro: '—', enterprise: '✓' },
  { key: 'auditLog', labelKey: 'settings.plan.limits.auditLog', free: '—', pro: '—', enterprise: '✓' },
];

export function PlanTab() {
  const { t } = useTranslation();
  // In local mode, plan is always shown as FREE (no auth context)
  const plan = 'FREE' as 'FREE' | 'PRO' | 'ENTERPRISE';
  const display = PLAN_DISPLAY[plan];

  return (
    <div className="space-y-6">
      {/* Current plan badge */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-text-secondary">{t('settings.plan.current')}:</span>
        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${display.color}`}>
          {display.label}
        </span>
      </div>

      {/* Comparison table */}
      <div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-tertiary font-medium">Feature</th>
              {(['FREE', 'PRO', 'ENTERPRISE'] as const).map(tier => (
                <th
                  key={tier}
                  className={`text-center py-2 font-semibold px-2 ${
                    tier === plan ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {PLAN_DISPLAY[tier].label}
                  {tier === plan && (
                    <span className="ml-1 text-[9px] text-primary">← you</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIMIT_ROWS.map(row => (
              <tr key={row.key} className="border-b border-border/50">
                <td className="py-2 text-text-secondary">{t(row.labelKey)}</td>
                {([row.free, row.pro, row.enterprise] as string[]).map((val, i) => {
                  const tier = ['FREE', 'PRO', 'ENTERPRISE'][i] as 'FREE' | 'PRO' | 'ENTERPRISE';
                  return (
                    <td
                      key={tier}
                      className={`text-center py-2 px-2 ${
                        tier === plan ? 'font-semibold text-primary' : 'text-text-tertiary'
                      } ${val === '—' ? 'opacity-40' : ''}`}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plan !== 'ENTERPRISE' && (
        <div className="pt-2">
          <a
            href="https://cairnpath.io/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-[11px] bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('settings.plan.upgrade')} →
          </a>
        </div>
      )}
    </div>
  );
}
