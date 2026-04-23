import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { appointmentsApi, consentApi, availabilityApi, type AvailabilitySlot } from '../../api';
import type { Appointment, ConsentRecord } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Booking flow
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<'doctor' | 'slots'>('doctor');
  const [linkedDoctors, setLinkedDoctors] = useState<ConsentRecord[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<ConsentRecord | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<string | null>(null);

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

  const handleSelectDoctor = async (consent: ConsentRecord) => {
    setSelectedDoctor(consent);
    setStep('slots');
    setLoadingSlots(true);
    try {
      const { data } = await availabilityApi.getDoctorSlots(consent.doctorId);
      setAvailableSlots(data);
    } finally { setLoadingSlots(false); }
  };

  const handleBookSlot = async (slot: AvailabilitySlot) => {
    setBooking(slot.id);
    try {
      const { data } = await availabilityApi.bookSlot(slot.id);
      setAppointments((prev) => [data.appointment, ...prev]);
      setShowForm(false);
      setStep('doctor');
      setSelectedDoctor(null);
      setAvailableSlots([]);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erro ao agendar');
    } finally { setBooking(null); }
  };

  const resetForm = () => {
    setShowForm(false);
    setStep('doctor');
    setSelectedDoctor(null);
    setAvailableSlots([]);
  };

  const statusColor: Record<string, 'yellow' | 'green' | 'red'> = {
    pending: 'yellow', confirmed: 'green', cancelled: 'red',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('appointments.title')}</h1>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? t('common.cancel') : '+ ' + t('appointments.book')}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-4">
          {step === 'doctor' && (
            <>
              <p className="text-sm font-semibold text-gray-700">Escolha o médico</p>
              {linkedDoctors.length === 0 ? (
                <p className="text-sm text-gray-400">Você não tem médicos vinculados. Solicite um vínculo em Configurações.</p>
              ) : (
                <div className="space-y-2">
                  {linkedDoctors.map((c) => (
                    <button
                      key={c.doctorId}
                      onClick={() => handleSelectDoctor(c)}
                      className="w-full rounded-xl border border-gray-200 p-4 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-gray-800">{(c as any).doctor?.fullName ?? 'Médico'}</p>
                      <p className="text-xs text-gray-400">{(c as any).doctor?.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'slots' && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('doctor')} className="text-xs text-indigo-600 hover:underline">← Voltar</button>
                <p className="text-sm font-semibold text-gray-700">
                  Horários disponíveis — {(selectedDoctor as any)?.doctor?.fullName ?? 'Médico'}
                </p>
              </div>
              {loadingSlots && <p className="text-sm text-gray-400">Carregando horários…</p>}
              {!loadingSlots && availableSlots.length === 0 && (
                <p className="text-sm text-gray-400">Nenhum horário disponível no momento. Aguarde o médico cadastrar novos horários.</p>
              )}
              {!loadingSlots && availableSlots.length > 0 && (
                <div className="space-y-2">
                  {availableSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {format(parseISO(slot.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}</p>
                      </div>
                      <Button
                        onClick={() => handleBookSlot(slot)}
                        loading={booking === slot.id}
                        className="text-xs px-4 py-2"
                      >
                        Agendar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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
