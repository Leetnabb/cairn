import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { Button } from '../ui/Button';
import { getDateLocale } from '../../lib/labels';

export function SnapshotList() {
  const { t } = useTranslation();
  const snapshots = useStore(s => s.snapshots);
  const restoreSnapshot = useStore(s => s.restoreSnapshot);
  const deleteSnapshot = useStore(s => s.deleteSnapshot);

  return (
    <div>
      <h3 className="text-[11px] font-semibold mb-2">{t('snapshots.title')}</h3>
      {snapshots.length === 0 ? (
        <p className="text-[10px] text-text-tertiary italic">{t('snapshots.none')}</p>
      ) : (
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {snapshots.map(s => (
            <li key={s.id} className="flex items-center justify-between px-2 py-1 rounded border border-border bg-gray-50">
              <div>
                <div className="text-[10px] font-medium">{s.label || t('snapshots.default')}</div>
                <div className="text-[8px] text-text-tertiary">
                  {new Date(s.timestamp).toLocaleDateString(getDateLocale(), {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
              <div className="flex gap-1">
                <Button onClick={() => {
                  if (confirm(t('snapshots.confirmRestore'))) {
                    restoreSnapshot(s.id);
                  }
                }}>{t('snapshots.restore')}</Button>
                <Button variant="danger" onClick={() => deleteSnapshot(s.id)}>\u00d7</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
