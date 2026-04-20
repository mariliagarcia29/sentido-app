import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { observationsApi } from '../../api';
import type { ClinicalObservation } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const severityColor: Record<string, 'blue' | 'yellow' | 'red'> = {
  info: 'blue', warn: 'yellow', critical: 'red',
};

const severityLabel: Record<string, string> = {
  info: 'Info', warn: 'Atenção', critical: 'Crítico',
};

export default function ObservationsPage() {
  const { t } = useTranslation();
  const [observations, setObservations] = useState<ClinicalObservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    observationsApi.mine().then((r) => setObservations(r.data)).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await observationsApi.markRead(id).catch(() => {});
    setObservations((prev) => prev.map((o) => o.id === id ? { ...o, isRead: true } : o));
  };

  const unread = observations.filter((o) => !o.isRead);

  if (loading) return <p className="text-sm text-gray-400">{t('common.loading')}</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.observations')}</h1>
        {unread.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">
            {unread.length} não lida{unread.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {observations.map((obs) => (
          <Card
            key={obs.id}
            className={`flex gap-4 transition-opacity ${obs.isRead ? 'opacity-60' : ''}`}
          >
            <div className="pt-0.5">
              <Badge color={severityColor[obs.severity]}>{severityLabel[obs.severity]}</Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{obs.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(obs.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {' · '}
                {obs.triggeredBy === 'doctor' ? 'Seu médico' : 'Sistema de alertas'}
              </p>
            </div>
            {!obs.isRead && (
              <Button
                variant="ghost"
                className="shrink-0 text-xs px-2 py-1 h-fit self-start"
                onClick={() => markRead(obs.id)}
              >
                Marcar como lida
              </Button>
            )}
          </Card>
        ))}
        {observations.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
