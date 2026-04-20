import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { consentApi } from '../../api';
import type { ConsentRecord } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

export default function ConsentPage() {
  const { t } = useTranslation();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    consentApi.list().then((r) => setConsents(r.data)).finally(() => setLoading(false));
  }, []);

  const act = async (id: string, action: 'approve' | 'revoke') => {
    setActing(id);
    try {
      await consentApi.act(id, action);
      setConsents((prev) =>
        prev.map((c) => c.id === id ? { ...c, status: action === 'approve' ? 'active' : 'revoked' } : c)
      );
    } finally { setActing(null); }
  };

  const invite = async () => {
    if (!patientEmail.trim()) return;
    setInviting(true);
    try {
      const { data } = await consentApi.invite(patientEmail);
      setConsents((prev) => [data as ConsentRecord, ...prev]);
      setPatientEmail('');
      setShowInvite(false);
    } finally { setInviting(false); }
  };

  const statusColor: Record<string, 'yellow' | 'green' | 'red'> = {
    pending: 'yellow', active: 'green', revoked: 'red',
  };

  if (loading) return <p className="text-sm text-gray-400">{t('common.loading')}</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('doctor.consent')}</h1>
        <Button variant="outline" onClick={() => setShowInvite((s) => !s)}>
          {showInvite ? t('common.cancel') : '+ Convidar paciente'}
        </Button>
      </div>

      {showInvite && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Convidar paciente por e-mail</p>
          <Input
            type="email"
            placeholder="paciente@email.com"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
          />
          <Button onClick={invite} loading={inviting}>Enviar convite</Button>
        </Card>
      )}

      <div className="space-y-3">
        {consents.map((c) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Paciente: {(c as any).patient?.fullName ?? c.patientId.slice(0, 8) + '…'}
              </p>
              <p className="text-xs text-gray-400">{format(new Date(c.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={statusColor[c.status]}>
                {t(`doctor.consent${c.status.charAt(0).toUpperCase() + c.status.slice(1)}`)}
              </Badge>
              {c.status === 'active' && (
                <Button
                  variant="danger"
                  className="text-xs px-3 py-1"
                  loading={acting === c.id}
                  onClick={() => act(c.id, 'revoke')}
                >
                  Revogar
                </Button>
              )}
            </div>
          </Card>
        ))}
        {consents.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>}
      </div>
    </div>
  );
}
