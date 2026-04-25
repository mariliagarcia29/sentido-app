import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import i18n from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { preferencesApi, notificationsApi, consentApi, exportsApi, authApi, type UserPreferences } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushSupported] = useState('Notification' in window && 'serviceWorker' in navigator);
  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [requestingExport, setRequestingExport] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    preferencesApi.get().then((r) => setPrefs(r.data)).catch(() => {});
    consentApi.myDoctors().then((r) => setDoctors(r.data)).catch(() => {});
  }, []);

  const save = async (patch: Partial<UserPreferences>) => {
    setSaving(true);
    try {
      const { data } = await preferencesApi.update(patch);
      setPrefs(data);
    } finally { setSaving(false); }
  };

  const togglePush = async () => {
    if (!pushSupported) return;
    if (pushEnabled) { setPushEnabled(false); return; }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPushEnabled(true);
      await notificationsApi.registerToken('web', 'web-' + user?.id).catch(() => {});
    }
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('sentido_lang', code);
    setCurrentLang(code);
    if (prefs) save({ language: code });
  };

  const handleRevoke = async (consentId: string, doctorName: string) => {
    if (!window.confirm(`Revogar acesso de ${doctorName}?`)) return;
    setRevoking(consentId);
    try {
      await consentApi.act(consentId, 'revoke');
      setDoctors((prev) => prev.filter((d) => d.id !== consentId));
    } finally { setRevoking(null); }
  };

  const handleRequestExport = async () => {
    setRequestingExport(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      await exportsApi.generate({ from, to: today, includes: ['moods', 'symptoms', 'medications', 'notes'] });
      alert('Exportação solicitada! Você receberá uma notificação quando o PDF estiver pronto.');
    } catch {
      alert('Erro ao solicitar exportação.');
    } finally { setRequestingExport(false); }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Excluir conta? Seus dados serão removidos permanentemente em até 15 dias. Esta ação não pode ser desfeita.'
    );
    if (!confirmed) return;
    alert('Solicitação de exclusão registrada. Você receberá um e-mail de confirmação.');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.next !== pwForm.confirm) { setPwError('As senhas novas não coincidem.'); return; }
    if (pwForm.next.length < 6) { setPwError('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.current, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setPwError(err?.response?.data?.message ?? 'Erro ao alterar senha.');
    } finally { setPwSaving(false); }
  };

  const activeDoctors = doctors.filter((d) => d.status === 'active');

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>

      {/* Perfil */}
      <Card className="space-y-2">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Perfil</p>
        <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
      </Card>

      {/* Trocar senha */}
      <Card className="space-y-3">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Segurança</p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {(['current', 'next', 'confirm'] as const).map((field) => (
            <div key={field}>
              <label className="text-xs text-gray-500 block mb-1">
                {field === 'current' ? 'Senha atual' : field === 'next' ? 'Nova senha' : 'Confirmar nova senha'}
              </label>
              <input
                type="password"
                value={pwForm[field]}
                onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
          ))}
          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-green-600">Senha alterada com sucesso!</p>}
          <Button type="submit" loading={pwSaving} className="w-full">Trocar senha</Button>
        </form>
      </Card>

      {/* Idioma */}
      <Card className="space-y-3">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{t('settings.language')}</p>
        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                currentLang === lang.code
                  ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-200'
                  : 'text-gray-700 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
              {currentLang === lang.code && <span className="ml-auto text-indigo-500">✓</span>}
            </button>
          ))}
        </div>
      </Card>

      {/* Notificações */}
      <Card className="space-y-4">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{t('settings.notifications')}</p>

        {pushSupported ? (
          <Toggle checked={pushEnabled} onChange={togglePush} label="Notificações push no navegador" />
        ) : (
          <p className="text-xs text-gray-400">Seu navegador não suporta notificações push.</p>
        )}

        {prefs && (
          <>
            <Toggle
              checked={prefs.appointmentReminders}
              onChange={(v) => save({ appointmentReminders: v })}
              label="Lembretes de consulta"
            />
            <Toggle
              checked={prefs.alertNotifications}
              onChange={(v) => save({ alertNotifications: v })}
              label="Alertas de saúde"
            />
            <div>
              <label className="text-sm text-gray-700 block mb-1">Horário do lembrete diário</label>
              <input
                type="time"
                defaultValue={prefs.reminderTime ?? '08:00'}
                onBlur={(e) => save({ reminderTime: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {saving && <p className="text-xs text-indigo-500">Salvando…</p>}
      </Card>

      {/* LGPD — Médicos com acesso */}
      <Card className="space-y-3">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{t('settings.privacy')}</p>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{t('settings.doctorsWithAccess', 'Médicos com acesso')}</p>
          {activeDoctors.length === 0 ? (
            <p className="text-sm text-gray-400">{t('settings.noActiveDoctors', 'Nenhum médico com acesso ativo')}</p>
          ) : (
            <div className="space-y-2">
              {activeDoctors.map((consent) => (
                <div key={consent.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {consent.doctor?.fullName ?? consent.doctor?.email ?? 'Médico'}
                    </p>
                    <p className="text-xs text-gray-400">{consent.doctor?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="green">Ativo</Badge>
                    <Button
                      variant="danger"
                      className="text-xs px-2 py-1"
                      loading={revoking === consent.id}
                      onClick={() => handleRevoke(consent.id, consent.doctor?.fullName ?? 'médico')}
                    >
                      {t('settings.revoke', 'Revogar')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 space-y-2 border-t border-gray-100">
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            loading={requestingExport}
            onClick={handleRequestExport}
          >
            📦 {t('settings.requestData')}
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start text-sm"
            onClick={handleDeleteAccount}
          >
            🗑 {t('settings.deleteAccount')}
          </Button>
        </div>
      </Card>

      <Button variant="ghost" onClick={handleLogout} className="w-full">
        {t('auth.logout')}
      </Button>
    </div>
  );
}
