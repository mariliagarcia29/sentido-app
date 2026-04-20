import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { doctorApi } from '../../api';
import type { User } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PatientsPage() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorApi.listPatients()
      .then((r) => setPatients(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">{t('common.loading')}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('doctor.patients')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((p) => (
          <Card key={p.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                {p.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{p.fullName}</p>
                <p className="text-xs text-gray-400">{p.email}</p>
              </div>
            </div>
            <Link to={`/doctor/patients/${p.id}`}>
              <Button variant="outline" className="w-full text-xs">
                {t('doctor.summary')}
              </Button>
            </Link>
          </Card>
        ))}
        {patients.length === 0 && (
          <p className="col-span-3 text-center text-sm text-gray-400 py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
