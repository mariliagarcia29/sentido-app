import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { consentApi } from '../../api';
import type { ConsentRecord } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

export default function ConsentManagePage() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<ConsentRecord[]>([]);
  const [active, setActive] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [requesting, setRequesting] = useState(false);
  // 2-step confirmation state
  const [confirmApprove, setConfirmApprove] = useState<ConsentRecord | null>(null);

  useEffect(() => {
    Promise.all([
      consentApi.listPending().catch(() => ({ data: [] as ConsentRecord[] })),
      consentApi.myDoctors().catch(() => ({ data: [] as ConsentRecord[] })),
    ]).then(([p, a]) => {
      setPending(p.data);
      setActive(a.data.filter((c) => c.status === 'active'));
    }).finally(() => setLoading(false));
  }, []);

  // Step 2 of 2: confirmed approval
  const confirmAndApprove = async () => {
    if (!confirmApprove) return;
    setActing(confirmApprove.id);
    try {
      await consentApi.act(confirmApprove.id, 'approve');
      setPending((prev) => prev.filter((c) => c.id !== confirmApprove.id));
      setActive((prev) => [...prev, { ...confirmApprove, status: 'active' }]);
    } finally {
      setActing(null);
      setConfirmApprove(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Revogar acesso deste médico? Ele não poderá mais ver seus dados.')) return;
    setActing(id);
    try {
      await consentApi.act(id, 'revoke');
      setActive((prev) => prev.filter((c) => c.id !== id));
    } finally { setActing(null); }
  };

  const handleRequest = async () => {
    if (!doctorEmail.trim()) return;
    setRequesting(true);
    try {
      await consentApi.request(doctorEmail.trim());
      setDoctorEmail('');
      setShowRequest(false);
      alert('Solicitação enviada! O médico receberá uma notificação.');
    } catch {
      alert('Erro ao enviar solicitação. Verifique o e-mail do médico.');
    } finally { setRequesting(false); }
  };

  const doctorName = (c: ConsentRecord) =>
    (c as any).doctor?.fullName ?? (c as any).doctor?.email ?? 'Médico';

  if (loading) return <p className="text-sm text-gray-400 p-8">{t('common.loading')}</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Consentimentos LGPD</h1>
        <Button variant="outline" onClick={() => setShowRequest((s) => !s)}>
          {showRequest ? t('common.cancel') : '+ Vincular médico'}
        </Button>
      </div>

      {/* Solicitar vínculo com médico */}
      {showRequest && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Solicitar vínculo com médico</p>
          <p className="text-xs text-gray-400">O médico receberá uma solicitação e precisará aceitar.</p>
          <Input
            type="email"
            placeholder="medico@email.com"
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
          />
          <Button onClick={handleRequest} loading={requesting}>Enviar solicitação</Button>
        </Card>
      )}

      {/* Pendentes — requer aprovação do paciente (2 etapas conforme LGPD Art. 18) */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Aguardando sua aprovação
          </h2>
          <div className="space-y-3">
            {pending.map((c) => (
              <Card key={c.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doctorName(c)}</p>
                    <p className="text-xs text-gray-400">
                      Solicitado em {format(new Date(c.createdAt), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Acesso: <span className="font-medium">{c.accessLevel ?? 'completo'}</span>
                    </p>
                  </div>
                  <Badge color="yellow">Pendente</Badge>
                </div>

                {/* Passo 1: clicar em Aprovar abre confirmação */}
                {confirmApprove?.id !== c.id ? (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 text-sm"
                      onClick={() => setConfirmApprove(c)}
                    >
                      Aprovar acesso
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1 text-sm"
                      loading={acting === c.id}
                      onClick={() => handleRevoke(c.id)}
                    >
                      Recusar
                    </Button>
                  </div>
                ) : (
                  /* Passo 2: confirmação explícita (LGPD Art. 18 — consentimento inequívoco) */
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-3">
                    <p className="text-sm font-medium text-amber-800">
                      Confirmar consentimento de acesso
                    </p>
                    <p className="text-xs text-amber-700">
                      Ao confirmar, <strong>{doctorName(c)}</strong> poderá visualizar seus registros de
                      humor, sintomas e medicações enquanto o vínculo estiver ativo. Você pode revogar a
                      qualquer momento nas configurações.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 text-sm"
                        loading={acting === c.id}
                        onClick={confirmAndApprove}
                      >
                        Sim, confirmo o acesso
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-sm"
                        onClick={() => setConfirmApprove(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Médicos com acesso ativo */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Médicos com acesso ativo
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">{t('settings.noActiveDoctors', 'Nenhum médico com acesso ativo')}</p>
        ) : (
          <div className="space-y-3">
            {active.map((c) => (
              <Card key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{doctorName(c)}</p>
                  <p className="text-xs text-gray-400">Desde {format(new Date(c.createdAt), 'dd/MM/yyyy')}</p>
                  <p className="text-xs text-gray-500">Acesso: {c.accessLevel ?? 'completo'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="green">Ativo</Badge>
                  <Button
                    variant="danger"
                    className="text-xs px-3 py-1"
                    loading={acting === c.id}
                    onClick={() => handleRevoke(c.id)}
                  >
                    Revogar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
