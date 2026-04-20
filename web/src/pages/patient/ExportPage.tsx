import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { exportsApi } from '../../api';
import type { PdfExport } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const allIncludes = ['moods', 'symptoms', 'medications'] as const;

export default function ExportPage() {
  const { t } = useTranslation();
  const [exports, setExports] = useState<PdfExport[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includes, setIncludes] = useState<string[]>(['moods', 'symptoms', 'medications']);
  const [generating, setGenerating] = useState(false);
  const [warned, setWarned] = useState(false);

  useEffect(() => {
    exportsApi.list().then((r) => setExports(r.data));
  }, []);

  const toggleInclude = (key: string) => {
    setIncludes((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const generate = async () => {
    if (!warned) { setWarned(true); return; }
    setGenerating(true);
    try {
      const { data } = await exportsApi.generate({ from, to, includes });
      setExports((prev) => [data, ...prev]);
      setWarned(false);
    } finally { setGenerating(false); }
  };

  const statusColor: Record<string, 'yellow' | 'green' | 'red' | 'blue'> = {
    pending: 'yellow', processing: 'blue', done: 'green', failed: 'red',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('export.title')}</h1>

      <Card className="space-y-4">
        <p className="text-sm font-medium text-gray-700">{t('export.period')}</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500">{t('export.from')}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">{t('export.to')}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{t('export.includes')}</p>
          <div className="flex flex-wrap gap-3">
            {allIncludes.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includes.includes(key)} onChange={() => toggleInclude(key)} />
                {t(`export.${key}`)}
              </label>
            ))}
          </div>
        </div>

        {warned && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
            ⚠️ {t('export.warning')} Clique novamente para confirmar.
          </div>
        )}

        <Button onClick={generate} loading={generating} disabled={!from || !to || includes.length === 0}>
          {t('export.generate')}
        </Button>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-gray-700 mb-4">{t('export.history')}</h2>
        <div className="space-y-3">
          {exports.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
              <div>
                <p className="text-sm text-gray-700">{format(new Date(ex.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                {ex.status === 'done' && ex.expiresAt && (
                  <p className="text-xs text-gray-400">{t('export.expiresAt')}: {format(new Date(ex.expiresAt), 'dd/MM/yyyy HH:mm')}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge color={statusColor[ex.status]}>{t(`export.${ex.status}`)}</Badge>
                {ex.status === 'done' && ex.fileUrl && (
                  <a href={ex.fileUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="text-xs px-3 py-1">{t('export.download')}</Button>
                  </a>
                )}
              </div>
            </div>
          ))}
          {exports.length === 0 && <p className="text-sm text-gray-400">{t('common.noData')}</p>}
        </div>
      </Card>
    </div>
  );
}
