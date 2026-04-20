import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', dateOfBirth: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch {
      setError('Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <span className="text-4xl">💜</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('auth.fullName')} type="text" value={form.fullName} onChange={set('fullName')} required />
          <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} required />
          <Input label={t('auth.password')} type="password" value={form.password} onChange={set('password')} required />
          <Input label={t('auth.dateOfBirth')} type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            {t('auth.register')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
