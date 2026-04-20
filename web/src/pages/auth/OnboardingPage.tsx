import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

type Step = 'account' | 'lgpd';

interface AccountForm {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  role: 'patient' | 'doctor';
  specialty: string;
  crmLink: string;
}

export default function OnboardingPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('account');
  const [form, setForm] = useState<AccountForm>({
    fullName: '', email: '', password: '', dateOfBirth: '',
    role: 'patient', specialty: '', crmLink: '',
  });
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [lgpdDataProcessing, setLgpdDataProcessing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.email || !form.password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setStep('lgpd');
  };

  const handleFinish = async () => {
    if (!lgpdAccepted || !lgpdDataProcessing) {
      setError('Você precisa aceitar os termos para continuar.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        dateOfBirth: form.dateOfBirth || undefined,
        role: form.role,
        specialty: form.specialty || undefined,
        crmLink: form.crmLink || undefined,
      } as any);
      navigate('/dashboard');
    } catch {
      setError('Erro ao criar conta. Verifique os dados e tente novamente.');
      setStep('account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {(['account', 'lgpd'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-2 flex-1 rounded-full transition-colors ${step === s || (i === 0) ? 'bg-indigo-600' : 'bg-gray-200'} ${step === 'lgpd' && i === 0 ? 'bg-indigo-600' : ''}`} />
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-gray-400">
          {step === 'account' ? 'Passo 1 de 2 — Dados da conta' : 'Passo 2 de 2 — Termos LGPD'}
        </p>

        {/* Step 1: Account */}
        {step === 'account' && (
          <Card className="space-y-4">
            <div className="text-center">
              <span className="text-4xl">💜</span>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
            </div>

            <form onSubmit={handleAccountNext} className="space-y-4">
              <Input label={t('auth.fullName')} type="text" value={form.fullName} onChange={set('fullName')} required />
              <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} required />
              <Input label={t('auth.password')} type="password" value={form.password} onChange={set('password')} required />
              <Input label={t('auth.dateOfBirth')} type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  value={form.role}
                  onChange={set('role')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="patient">Paciente</option>
                  <option value="doctor">Médico</option>
                </select>
              </div>

              {form.role === 'doctor' && (
                <>
                  <Input label="Especialidade" type="text" value={form.specialty} onChange={set('specialty')} />
                  <Input label="CRM (link ou número)" type="text" value={form.crmLink} onChange={set('crmLink')} />
                </>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full">Próximo →</Button>
            </form>

            <p className="text-center text-sm text-gray-500">
              {t('auth.hasAccount')}{' '}
              <a href="/login" className="text-indigo-600 hover:underline font-medium">{t('auth.login')}</a>
            </p>
          </Card>
        )}

        {/* Step 2: LGPD consent — Art. 18 LGPD */}
        {step === 'lgpd' && (
          <Card className="space-y-5">
            <div className="text-center">
              <span className="text-4xl">🔒</span>
              <h1 className="mt-2 text-xl font-bold text-gray-900">Privacidade e Consentimento</h1>
              <p className="text-sm text-gray-500 mt-1">Art. 18 da Lei Geral de Proteção de Dados (Lei 13.709/2018)</p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800 space-y-2">
              <p className="font-semibold">Seus direitos como titular de dados:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar e corrigir seus dados a qualquer momento</li>
                <li>Solicitar portabilidade ou exclusão dos dados</li>
                <li>Revogar o consentimento concedido a médicos</li>
                <li>Ser informado sobre compartilhamento de dados</li>
              </ul>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm text-gray-700">
                  Li e aceito os{' '}
                  <span className="text-indigo-600 font-medium">Termos de Uso e Política de Privacidade</span>{' '}
                  do Sentido, incluindo o tratamento de dados de saúde conforme a LGPD.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdDataProcessing}
                  onChange={(e) => setLgpdDataProcessing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm text-gray-700">
                  Consinto com o tratamento dos meus dados de saúde (humor, sintomas, medicações) para fins de
                  acompanhamento médico e geração de relatórios, podendo revogar este consentimento a qualquer momento.
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('account')}>
                ← {t('common.back')}
              </Button>
              <Button
                className="flex-1"
                loading={loading}
                onClick={handleFinish}
                disabled={!lgpdAccepted || !lgpdDataProcessing}
              >
                Criar conta
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
