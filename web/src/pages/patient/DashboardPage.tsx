import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { recordsApi, appointmentsApi } from '../../api';
import type { MoodEntry, Appointment } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const moodEmoji = ['', '😞', '😕', '😐', '🙂', '😊'];
const moodColors = ['', '#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#51CF66'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    recordsApi.listMoods().then((r) => setMoods(r.data));
    appointmentsApi.list().then((r) => setAppointments(r.data));
  }, []);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const key = format(date, 'yyyy-MM-dd');
    const entry = moods.find((m) => m.createdAt.startsWith(key));
    return { day: format(date, 'EEE', { locale: ptBR }), score: entry?.score ?? 0 };
  });

  const upcoming = appointments
    .filter((a) => a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const submitMood = async () => {
    if (!moodScore) return;
    setSubmitting(true);
    try {
      const { data } = await recordsApi.createMood(moodScore);
      setMoods((prev) => [data, ...prev]);
      setMoodScore(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('dashboard.greeting', { name: user?.fullName?.split(' ')[0] })}
      </h1>

      {/* Mood check-in */}
      <Card>
        <h2 className="text-base font-semibold text-gray-700 mb-4">{t('dashboard.moodToday')}</h2>
        <div className="flex gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setMoodScore(s)}
              className={`text-3xl transition-transform hover:scale-110 ${moodScore === s ? 'scale-125' : 'opacity-70'}`}
            >
              {moodEmoji[s]}
            </button>
          ))}
        </div>
        {moodScore && (
          <Button onClick={submitMood} loading={submitting} className="mt-2">
            {t('dashboard.quickActions')}
          </Button>
        )}
      </Card>

      {/* 7-day chart */}
      <Card>
        <h2 className="text-base font-semibold text-gray-700 mb-4">{t('dashboard.recentMoods')}</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={last7} barSize={28}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 5]} hide />
            <Tooltip formatter={(v) => [`${moodEmoji[Number(v)] ?? ''} ${v}`, 'Humor']} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {last7.map((entry, i) => (
                <Cell key={i} fill={moodColors[entry.score] ?? '#e9ecef'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Upcoming appointments */}
      <Card>
        <h2 className="text-base font-semibold text-gray-700 mb-4">{t('dashboard.upcomingAppointments')}</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.noAppointments')}</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{appt.doctor?.fullName ?? 'Médico'}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(appt.scheduledAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Badge color={appt.status === 'confirmed' ? 'green' : 'yellow'}>
                  {t(`appointments.${appt.status}`)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
