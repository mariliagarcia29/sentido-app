import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { appointmentsApi, consentApi } from '../../api';
import type { Appointment, ConsentRecord } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [linkedDoctors, setLinkedDoctors] = useState<ConsentRecord[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    appointmentsApi.list().then((r) => setAppointments(r.data));
    consentApi.myDoctors().then((r) => setLinkedDoctors(r.data.filter((c) => c.status === 'active')));
  }, []);

  const now = new Date();
  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && new Date(a.scheduledAt) > now);
  const past = appointments.filter((a) => a.status === 'cancelled' || new Date(a.scheduledAt) <= now);
  const list = tab === 'upcoming' ? upcoming : past;

  const handleCancel = async (id: string) => {
    if (!window.confirm(t('appointments.cancelConfirm'))) return;
    setCancelling(id);
    try {
      const { data } = await appointmentsApi.cancel(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)));
    } finally { setCancelling(null); }
  };

  const handleBook = async () => {
    if (!doctorId || !scheduledAt) return;
    setBooking(true);
    try {
      const { data } = await appointmentsApi.create(doctorId, new Date(scheduledAt).toISOString());
      setAppointments((prev) => [data, ...prev]);
      setDoctorId(''); setScheduledAt(''); setShowForm(false);
    } finally { setBooking(false); }
  };

  const statusColor: Record<string, 'yellow' | 'green' | 'red'> = {
    pending: 'yellow', confirmed: 'green', cancelled: 'red',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('appointments.title')}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? t('common.cancel') : '+ ' + t('appointments.book')}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">{t('appointments.book')}</p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('appointments.doctor')}</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Selecione um médico…</option>
              {linkedDoctors.map((c) => (
                <option key={c.doctorId} value={c.doctorId}>
                  {(c as any).doctor?.fullName ?? c.doctorId}
                </option>
              ))}
            </select>
            {linkedDoctors.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">Você não tem médicos vinculados. Solicite um vínculo em Configurações.</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('appointments.scheduledAt')}</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <Button onClick={handleBook} loading={booking} disabled={!doctorId || !scheduledAt}>
            Confirmar agendamento
          </Button>
        </Card>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {(['upcoming', 'past'] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t_ ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t(`appointments.${t_}`)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((appt) => (
          <Card key={appt.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{appt.doctor?.fullName ?? 'Médico'}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(appt.scheduledAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={statusColor[appt.status]}>{t(`appointments.${appt.status}`)}</Badge>
              {appt.status === 'confirmed' && (
                <Link to={`/appointments/${appt.id}/room`}>
                  <Button variant="secondary" className="text-xs px-3 py-1">{t('appointments.joinVideo')}</Button>
                </Link>
              )}
              {appt.status !== 'cancelled' && tab === 'upcoming' && (
                <Button
                  variant="danger"
                  className="text-xs px-3 py-1"
                  loading={cancelling === appt.id}
                  onClick={() => handleCancel(appt.id)}
                >
                  {t('appointments.cancel')}
                </Button>
              )}
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>}
      </div>
    </div>
  );
}
