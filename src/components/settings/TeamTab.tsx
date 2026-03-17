import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiClient } from '../../hooks/useApiClient';

type TenantRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'BOARD';

interface Member {
  id: string;
  userId: string;
  email?: string;
  displayName?: string;
  role: TenantRole;
  acceptedAt?: string;
  inviteEmail?: string;
}

const ROLES: TenantRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'BOARD'];

export function TeamTab() {
  const { t } = useTranslation();
  const api = useApiClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TenantRole>('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Member[]>('/team').then(data => {
      setMembers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post('/team/invite', { email: inviteEmail.trim(), role: inviteRole });
      setInviteSent(true);
      setInviteEmail('');
      setTimeout(() => setInviteSent(false), 3000);
      load();
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm(t('settings.team.confirmRemove'))) return;
    await api.delete(`/team/${userId}`);
    load();
  };

  if (loading) {
    return <div className="text-[11px] text-text-tertiary">{t('common.loading', 'Loading...')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Member list */}
      <div>
        <h3 className="text-[11px] font-semibold text-text-primary mb-3 uppercase tracking-wider">
          {t('settings.team.members')}
        </h3>
        <div className="space-y-1">
          {members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-text-primary truncate">
                  {member.displayName ?? member.email ?? member.inviteEmail}
                </div>
                {member.displayName && member.email && (
                  <div className="text-[10px] text-text-tertiary truncate">{member.email}</div>
                )}
                {!member.acceptedAt && (
                  <div className="text-[10px] text-amber-500">Invite pending</div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary">
                  {t(`settings.team.roles.${member.role}`)}
                </span>
                {member.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="text-[10px] text-text-tertiary hover:text-red-500 transition-colors px-1"
                  >
                    {t('settings.team.remove')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite form */}
      <div>
        <h3 className="text-[11px] font-semibold text-text-primary mb-3 uppercase tracking-wider">
          {t('settings.team.inviteMember')}
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder={t('settings.team.email')}
            className="flex-1 px-3 py-2 text-[11px] border border-border rounded-lg focus:outline-none focus:border-primary"
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as TenantRole)}
            className="px-2 py-2 text-[11px] border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
          >
            {ROLES.filter(r => r !== 'OWNER').map(role => (
              <option key={role} value={role}>
                {t(`settings.team.roles.${role}`)}
              </option>
            ))}
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="px-4 py-2 text-[11px] bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {inviting ? '…' : t('settings.team.invite')}
          </button>
        </div>
        {inviteSent && (
          <p className="text-[11px] text-green-600 mt-2">{t('settings.team.inviteSent')}</p>
        )}
      </div>
    </div>
  );
}
