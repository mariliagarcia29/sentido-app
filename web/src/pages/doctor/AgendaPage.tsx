import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { availabilityApi, type AvailabilitySlot } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function AgendaPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    availabilityApi.getMySlots().then((r) => setSlots(r.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!date || !startTime || !endTime) return;
    if (startTime >= endTime) { setError('Horário de início deve ser antes do término.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await availabilityApi.createSlot({ date, startTime, endTime });
      setSlots((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
      setDate(''); setStartTime(''); setEndTime(''); setShowForm(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao criar slot');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await availabilityApi.deleteSlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erro ao remover slot');
    } finally { setDeleting(null); }
  };

  const available = slots.filter((s) => !s.isBooked);
  const booked = slots.filter((s) => s.isBooked);

  const fmtSlot = (s: AvailabilitySlot) =>
    `${format(parseISO(s.date), "EEE, dd 'de' MMM", { locale: ptBR })} · ${s.startTime}–${s.endTime}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancelar' : '+ Novo horário disponível'}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">Adicionar horário disponível</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="text-xs font-medium text-gray-600">Data</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Término</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleSave} loading={saving} disabled={!date || !startTime || !endTime}>
            Salvar horário
          </Button>
        </Card>
      )}

      {loading && <p className="text-sm text-gray-400">Carregando…</p>}

      {!loading && slots.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum horário cadastrado. Adicione horários disponíveis para que seus pacientes possam agendar consultas.</p>
      )}

      {available.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Horários disponíveis</h2>
          {available.map((s) => (
            <Card key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{fmtSlot(s)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="green">Disponível</Badge>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  {deleting === s.id ? '…' : 'Remover'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {booked.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Horários agendados</h2>
          {booked.map((s) => (
            <Card key={s.id} className="flex items-center justify-between py-3">
              <p className="text-sm font-medium text-gray-800">{fmtSlot(s)}</p>
              <Badge color="blue">Agendado</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
