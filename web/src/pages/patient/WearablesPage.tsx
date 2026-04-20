import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { wearablesApi, type WearableSummaryItem, type WearableConnection } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const dataTypeLabel: Record<string, string> = {
  steps: 'Passos', heart_rate: 'Freq. cardíaca', sleep: 'Sono',
  glucose: 'Glicose', weight: 'Peso', calories: 'Calorias',
};

const dataTypeUnit: Record<string, string> = {
  steps: 'passos', heart_rate: 'bpm', sleep: 'min',
  glucose: 'mg/dL', weight: 'kg', calories: 'kcal',
};

const dataTypeIcon: Record<string, string> = {
  steps: '👟', heart_rate: '❤️', sleep: '😴',
  glucose: '🩸', weight: '⚖️', calories: '🔥',
};

const providerLabel: Record<string, string> = {
  fitbit: 'Fitbit', garmin: 'Garmin', apple: 'Apple Health',
  google: 'Google Fit', samsung: 'Samsung Health',
};

function MetricCard({ item }: { item: WearableSummaryItem }) {
  const label = dataTypeLabel[item.dataType] ?? item.dataType;
  const unit = dataTypeUnit[item.dataType] ?? '';
  const icon = dataTypeIcon[item.dataType] ?? '📊';

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="text-3xl font-bold text-indigo-600">
        {Number(item.latest).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-gray-400">
        Média 7d: {Number(item.avg).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {unit}
      </p>
      {item.lastRecordedAt && (
        <p className="text-xs text-gray-300">
          {format(new Date(item.lastRecordedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
        </p>
      )}
    </Card>
  );
}

export default function WearablesPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [summary, setSummary] = useState<WearableSummaryItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [justConnected] = useState(searchParams.get('connected'));

  useEffect(() => {
    Promise.all([
      wearablesApi.getConnections().then((r) => setConnections(r.data)),
      wearablesApi.getSummary().then((r) => setSummary(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const syncFitbit = async () => {
    setSyncing(true);
    try {
      const { data } = await wearablesApi.syncFitbit();
      const [conn, sum] = await Promise.all([
        wearablesApi.getConnections(),
        wearablesApi.getSummary(),
      ]);
      setConnections(conn.data);
      setSummary(sum.data);
      alert(`Sincronizados ${data.synced} registros do Fitbit.`);
    } catch {
      alert('Erro ao sincronizar. Verifique a conexão com o Fitbit.');
    } finally { setSyncing(false); }
  };

  const disconnect = async (provider: string) => {
    if (!window.confirm(`Desconectar ${providerLabel[provider]}?`)) return;
    setDisconnecting(provider);
    try {
      await wearablesApi.disconnect(provider);
      setConnections((prev) => prev.filter((c) => c.provider !== provider));
    } finally { setDisconnecting(null); }
  };

  const fitbitConnected = connections.some((c) => c.provider === 'fitbit');

  if (loading) return <p className="text-sm text-gray-400">{t('common.loading')}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wearables</h1>

      {justConnected && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          ✅ {providerLabel[justConnected] ?? justConnected} conectado com sucesso!
        </div>
      )}

      {/* Dispositivos conectados */}
      <Card className="space-y-4">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Dispositivos</p>

        <div className="space-y-3">
          {/* Fitbit */}
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⌚</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Fitbit</p>
                {fitbitConnected && connections.find(c => c.provider === 'fitbit')?.lastSyncAt && (
                  <p className="text-xs text-gray-400">
                    Última sync: {format(new Date(connections.find(c => c.provider === 'fitbit')!.lastSyncAt!), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {fitbitConnected ? (
                <>
                  <Badge color="green">Conectado</Badge>
                  <Button variant="secondary" className="text-xs px-3 py-1" loading={syncing} onClick={syncFitbit}>
                    Sincronizar
                  </Button>
                  <Button variant="danger" className="text-xs px-3 py-1" loading={disconnecting === 'fitbit'} onClick={() => disconnect('fitbit')}>
                    Desconectar
                  </Button>
                </>
              ) : (
                <a href={wearablesApi.getFitbitConnectUrl()}>
                  <Button variant="outline" className="text-xs px-3 py-1">Conectar</Button>
                </a>
              )}
            </div>
          </div>

          {/* Garmin */}
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⌚</span>
              <p className="text-sm font-medium text-gray-800">Garmin</p>
            </div>
            <div className="flex items-center gap-2">
              {connections.some(c => c.provider === 'garmin') ? (
                <Badge color="green">Conectado</Badge>
              ) : (
                <Badge color="gray">Em breve</Badge>
              )}
            </div>
          </div>

          {/* Apple Health / Google Fit — push via mobile */}
          {(['apple', 'google'] as const).map((p) => (
            <div key={p} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p === 'apple' ? '🍎' : '🟢'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{providerLabel[p]}</p>
                  <p className="text-xs text-gray-400">Sincronizado pelo app mobile</p>
                </div>
              </div>
              <Badge color={connections.some(c => c.provider === p) ? 'green' : 'gray'}>
                {connections.some(c => c.provider === p) ? 'Ativo' : 'Via mobile'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Métricas de hoje */}
      {summary.length > 0 && (
        <>
          <p className="text-sm font-semibold text-gray-700">Últimos 7 dias</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((item) => (
              <MetricCard key={item.dataType} item={item} />
            ))}
          </div>
        </>
      )}

      {summary.length === 0 && connections.length > 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-400 text-sm">Nenhum dado ainda. Clique em "Sincronizar" para importar.</p>
        </Card>
      )}

      {connections.length === 0 && (
        <Card className="text-center py-8 space-y-2">
          <p className="text-4xl">⌚</p>
          <p className="text-gray-600 font-medium">Nenhum dispositivo conectado</p>
          <p className="text-sm text-gray-400">Conecte seu Fitbit ou use o app mobile para sincronizar Apple Health ou Google Fit.</p>
        </Card>
      )}
    </div>
  );
}
