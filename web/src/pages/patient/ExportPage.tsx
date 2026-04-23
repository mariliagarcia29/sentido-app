import { useState } from 'react';
import { availabilityApi } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const allIncludes = [
  { key: 'moods', label: 'Humor' },
  { key: 'symptoms', label: 'Sintomas' },
  { key: 'medications', label: 'Medicamentos' },
] as const;

export default function ExportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includes, setIncludes] = useState<string[]>(['moods', 'symptoms', 'medications']);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const toggleInclude = (key: string) => {
    setIncludes((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleDownload = async () => {
    if (!from || !to || includes.length === 0) return;
    setDownloading(true);
    setError('');
    try {
      const response = await availabilityApi.downloadCsv(from, to, includes);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sentido-${from}-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError('Erro ao gerar planilha. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  const isValid = from && to && from < to && includes.length > 0;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Exportar dados</h1>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Período</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {from && to && from >= to && (
            <p className="mt-1 text-xs text-red-500">A data final deve ser posterior à inicial.</p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Incluir na planilha</p>
          <div className="space-y-2">
            {allIncludes.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includes.includes(key)}
                  onChange={() => toggleInclude(key)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500">
          Os dados serão exportados como planilha CSV, compatível com Excel e Google Sheets.
        </div>

        <Button
          onClick={handleDownload}
          loading={downloading}
          disabled={!isValid}
          className="w-full"
        >
          Baixar planilha (.csv)
        </Button>
      </Card>
    </div>
  );
}
