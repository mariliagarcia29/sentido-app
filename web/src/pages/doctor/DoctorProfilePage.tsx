import { useState, useEffect } from 'react';
import { doctorProfileApi } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const BR_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

type CfmStatus = 'pending' | 'valid' | 'invalid' | 'expired';
type SignatureMethod = 'gov_br_prata' | 'icp_brasil_a3' | 'cloud_cert';

interface DoctorProfile {
  id: string;
  crmNumber: string;
  crmState: string;
  crmSpecialty: string | null;
  crmSecondary: string | null;
  cfmStatus: CfmStatus;
  cfmValidatedAt: string | null;
  cfmValidatorName: string | null;
  preferredSignatureMethod: SignatureMethod;
  govBrLinked: boolean;
  govBrLinkedAt: string | null;
  govBrLevel: string | null;
  bio: string | null;
  institution: string | null;
  attendanceModel: string | null;
  subspecialties: string[] | null;
}

const CFM_STATUS_LABELS: Record<CfmStatus, { label: string; color: string }> = {
  pending:  { label: 'Não verificado', color: 'text-yellow-600 bg-yellow-50' },
  valid:    { label: 'CRM válido ✓',   color: 'text-green-700 bg-green-50'  },
  invalid:  { label: 'CRM inválido ✗', color: 'text-red-700 bg-red-50'     },
  expired:  { label: 'Expirado',        color: 'text-gray-600 bg-gray-50'   },
};

const SIG_LABELS: Record<SignatureMethod, string> = {
  gov_br_prata: 'gov.br Prata',
  icp_brasil_a3: 'ICP-Brasil A3',
  cloud_cert: 'Certificado em nuvem',
};

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    crmNumber: '',
    crmState: 'SP',
    crmSpecialty: '',
    crmSecondary: '',
    preferredSignatureMethod: 'gov_br_prata' as SignatureMethod,
    bio: '',
    institution: '',
    attendanceModel: 'presencial',
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await doctorProfileApi.getMyProfile();
      if (res.data.profile) {
        const p: DoctorProfile = res.data.profile;
        setProfile(p);
        setForm({
          crmNumber: p.crmNumber ?? '',
          crmState: p.crmState ?? 'SP',
          crmSpecialty: p.crmSpecialty ?? '',
          crmSecondary: p.crmSecondary ?? '',
          preferredSignatureMethod: p.preferredSignatureMethod ?? 'gov_br_prata',
          bio: p.bio ?? '',
          institution: p.institution ?? '',
          attendanceModel: p.attendanceModel ?? 'presencial',
        });
      }
    } catch {
      // profile not yet created — blank form
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await doctorProfileApi.upsert({
        ...form,
        crmSpecialty:   form.crmSpecialty || undefined,
        crmSecondary:   form.crmSecondary || undefined,
        bio:            form.bio          || undefined,
        institution:    form.institution  || undefined,
      });
      setProfile(res.data.profile);
      setSuccess('Perfil salvo com sucesso.');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function handleValidateCrm() {
    setValidating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await doctorProfileApi.validateCrm(form.crmNumber, form.crmState);
      setProfile(res.data.profile);
      const v = res.data.validation;
      if (v.valid) {
        setSuccess(`CRM validado${v.name ? ` — ${v.name}` : ''}${v.warning ? ` (${v.warning})` : ''}`);
      } else {
        setError(`CRM inválido: ${v.warning ?? v.situation}`);
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao validar CRM.');
    } finally {
      setValidating(false);
    }
  }

  const cfmBadge = profile ? CFM_STATUS_LABELS[profile.cfmStatus] : null;

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Perfil Médico</h1>

      {error   && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{success}</div>}

      {/* ── CRM ─────────────────────────────────────────────── */}
      <Card>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Registro Profissional</h2>
            {cfmBadge && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfmBadge.color}`}>
                {cfmBadge.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do CRM *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="123456"
                value={form.crmNumber}
                onChange={e => setForm(f => ({ ...f, crmNumber: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={form.crmState}
                onChange={e => setForm(f => ({ ...f, crmState: e.target.value }))}
              >
                {BR_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade CFM</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Psiquiatria"
              value={form.crmSpecialty}
              onChange={e => setForm(f => ({ ...f, crmSpecialty: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registro secundário (CRP, CRN...)</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="CRP 06/12345"
              value={form.crmSecondary}
              onChange={e => setForm(f => ({ ...f, crmSecondary: e.target.value }))}
            />
          </div>

          {profile && (
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                onClick={handleValidateCrm}
                disabled={validating || !form.crmNumber}
              >
                {validating ? 'Verificando...' : 'Verificar CRM no CFM'}
              </Button>
              {profile.cfmValidatedAt && (
                <span className="text-xs text-gray-500">
                  Última verificação: {new Date(profile.cfmValidatedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          )}

          {!profile && (
            <p className="text-xs text-gray-500">Salve o perfil antes de verificar o CRM.</p>
          )}
        </div>
      </Card>

      {/* ── Assinatura digital ─────────────────────────────── */}
      <Card>
        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Assinatura Digital</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método preferido</label>
            <div className="space-y-2">
              {(Object.entries(SIG_LABELS) as [SignatureMethod, string][]).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sigMethod"
                    value={value}
                    checked={form.preferredSignatureMethod === value}
                    onChange={() => setForm(f => ({ ...f, preferredSignatureMethod: value }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {profile?.govBrLinked ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <span>✓</span>
              <span>
                gov.br vinculado ({profile.govBrLevel}) — {profile.govBrLinkedAt ? new Date(profile.govBrLinkedAt).toLocaleDateString('pt-BR') : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <span>⚠</span>
              <span>Conta gov.br não vinculada. Necessária para assinatura Prata e Ouro.</span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Perfil clínico ─────────────────────────────────── */}
      <Card>
        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Perfil Clínico</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instituição / Clínica</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Práxis Clínica"
              value={form.institution}
              onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade de atendimento</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={form.attendanceModel}
              onChange={e => setForm(f => ({ ...f, attendanceModel: e.target.value }))}
            >
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="híbrido">Híbrido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apresentação / Bio</label>
            <textarea
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Breve descrição da sua abordagem clínica..."
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !form.crmNumber}>
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </div>
    </div>
  );
}
