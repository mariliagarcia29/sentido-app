import { Link } from 'react-router-dom';

export const TERMS_VERSION = '1.1';
export const TERMS_DATE = 'Julho de 2026';

export interface TermsClause {
  number: number;
  title: string;
  content: string;
  highlight?: {
    type: 'warning' | 'info' | 'emergency';
    text: string;
  };
}

export const TERMS_CLAUSES: TermsClause[] = [
  {
    number: 1,
    title: 'Quem somos',
    content: `O Práxis é uma plataforma digital de acompanhamento longitudinal de saúde, desenvolvida para facilitar a comunicação entre pacientes e equipes multiprofissionais de saúde (psiquiatria, psicologia, nutrição, educação física, enfermagem e outras especialidades).

O Práxis é uma tecnologia intermediária: não prestamos serviços assistenciais diretamente e não somos um serviço de saúde. A responsabilidade assistencial pertence exclusivamente ao profissional ou à clínica que você vincula à sua conta. Cada profissional ou clínica que adota o Práxis possui seus próprios termos de atendimento, que complementam este documento.`,
  },
  {
    number: 2,
    title: 'Como funciona o atendimento',
    content: `O Práxis oferece ferramentas para que você registre dados de saúde (humor, sintomas, sono, atividade, medicamentos, escalas validadas e outros), e para que seu profissional de saúde visualize esses registros de forma organizada e longitudinal.

O app não realiza diagnósticos, não prescreve medicamentos e não substitui a consulta clínica. Sugestões ou alertas gerados pelo sistema têm caráter informativo e precisam ser avaliados e validados pelo profissional responsável pelo seu cuidado.`,
  },
  {
    number: 3,
    title: 'Comunicação com a clínica',
    content: `O Práxis oferece um canal de mensagens assíncrono com o profissional vinculado à sua conta. Este canal é uma ferramenta de apoio ao acompanhamento — não um canal de urgência e não substitui a consulta presencial ou a teleconsulta agendada.

Mensagens enviadas pelo aplicativo podem não ser lidas imediatamente. Cada clínica define seus próprios prazos e políticas de resposta. Para questões urgentes, utilize os canais indicados na cláusula 11 (Urgências e emergências).`,
    highlight: {
      type: 'warning',
      text: 'O chat do aplicativo não é monitorado 24 horas por dia. Não o utilize em situações de risco imediato à vida.',
    },
  },
  {
    number: 4,
    title: 'Prontuário e registro clínico',
    content: `Seus registros no Práxis (entradas de humor, sintomas, medicamentos, escalas, anotações e documentos) fazem parte do seu histórico de acompanhamento e podem ser acessados pelo profissional de saúde vinculado.

O profissional responsável pelo seu atendimento é o controlador dos dados clínicos para fins do prontuário, conforme a Resolução CFM 1.821/2007. O Práxis atua como operador de dados (Art. 39 da LGPD) nessa relação. Seus dados clínicos são retidos pelo prazo mínimo de 20 anos exigido pelo CFM, mesmo após o encerramento da conta.`,
  },
  {
    number: 5,
    title: 'Documentos médicos prévios',
    content: `Você pode enviar documentos e exames anteriores pelo Práxis (laudos, receitas, resultados de exames). Ao fazer isso, você declara ter autorização para compartilhá-los e estar ciente de que serão acessíveis ao(s) profissional(is) vinculado(s).

O Práxis não realiza análise ou interpretação desses documentos. Documentos enviados são armazenados com criptografia e ficam acessíveis apenas ao paciente e aos profissionais com consentimento de vínculo ativo.`,
  },
  {
    number: 6,
    title: 'Privacidade e LGPD',
    content: `O tratamento dos seus dados obedece à Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).

Base legal para dados comuns: consentimento (Art. 7º, I) e execução de contrato (Art. 7º, V).
Base legal para dados sensíveis de saúde: tutela da saúde pelo profissional responsável (Art. 11, II, "f").

Dados coletados: nome, CPF, e-mail, telefone, data de nascimento, dados de saúde (humor, sintomas, medicamentos, diagnósticos, escalas, exames), e preferências de comunicação.

Seus direitos (Art. 18 da LGPD):
• Confirmação da existência do tratamento
• Acesso aos seus dados
• Correção de dados incompletos ou desatualizados
• Anonimização, bloqueio ou eliminação de dados desnecessários
• Portabilidade a outro fornecedor de serviço
• Eliminação dos dados tratados com base no consentimento
• Informação sobre compartilhamento com terceiros
• Revogação do consentimento a qualquer momento

Para exercer esses direitos, acesse Configurações › Consentimentos ou entre em contato com o DPO.`,
  },
  {
    number: 7,
    title: 'Equipe envolvida',
    content: `Dependendo da clínica ou profissional que você vincula, sua equipe de cuidado pode incluir profissionais de diferentes especialidades: psiquiatria, psicologia, nutrição, educação física, enfermagem, assistência social e outros.

Cada profissional que acessa seus dados deve ter um consentimento de vínculo explícito seu (veja a cláusula de Consentimentos na plataforma). Você pode visualizar a lista de profissionais com acesso ativo em Configurações › Consentimentos e revogar o acesso de qualquer um a qualquer momento.

Assistentes ou secretárias de uma clínica podem ter acesso a dados administrativos (agendamentos, nome, contato), mas não têm acesso a dados clínicos sem autorização específica.`,
  },
  {
    number: 8,
    title: 'Tecnologia, transcrição e inteligência artificial',
    content: `O Práxis utiliza inteligência artificial (IA) como ferramenta de apoio — nunca como substituto do julgamento clínico. As funções de IA atualmente disponíveis incluem:

• Organização e resumo de dados para facilitar a revisão pelo profissional
• Detecção de padrões e emissão de alertas (ex.: queda de humor, interação medicamentosa)
• Sugestão de texto para pré-consulta e resumo de período

Todo conteúdo gerado por IA é sinalizado como tal e requer revisão e validação explícita do profissional antes de qualquer uso clínico. A IA não diagnostica, não prescreve e não decide.

O Práxis pode utilizar transcrição automática de áudio em funcionalidades futuras. Quando disponível, isso será comunicado previamente e requer consentimento separado.

Provedores de IA utilizados: Anthropic (Claude) para tarefas de linguagem não-clínicas; OpenEvidence para suporte clínico baseado em evidências (quando disponível). Todos os provedores operam sob contrato com cláusulas de não-retenção e não-treinamento com dados do usuário, conforme verificável em Configurações › IA › Conformidade.`,
  },
  {
    number: 9,
    title: 'Dados pseudonimizados e indicadores de saúde',
    content: `Para proteger sua privacidade nas funções de IA e na geração de indicadores agregados, o Práxis utiliza pseudonimização por código ALTIA (ex.: PRXIA26-0042-X7). Esse código substitui seu nome e identificadores diretos em todo processamento por IA externa.

Nunca enviamos seu nome real, CPF, e-mail ou identificador direto a sistemas de inteligência artificial. Apenas o código ALTIA e dados de saúde descontextualizados são transmitidos.

Indicadores agregados e anonimizados (ex.: médias populacionais de sono, humor, adesão medicamentosa) podem ser utilizados para fins de pesquisa clínica apenas mediante autorização expressa adicional, solicitada separadamente durante o onboarding ou nas configurações de privacidade.`,
    highlight: {
      type: 'info',
      text: 'Seu código ALTIA não pode ser revertido para sua identidade por terceiros. Apenas o Práxis mantém o mapeamento interno, protegido por criptografia.',
    },
  },
  {
    number: 10,
    title: 'Agendamento, cancelamento e no-show',
    content: `O Práxis pode ser usado para gerenciar agendamentos com a clínica ou profissional vinculado. As políticas de cancelamento, remarcação e cobrança por no-show são definidas exclusivamente pela clínica ou profissional de saúde — não pelo Práxis.

Lembretes de consulta enviados pelo Práxis são uma facilidade complementar. A responsabilidade de confirmar e comparecer à consulta é do paciente. Consulte diretamente sua clínica sobre a política de cancelamento com antecedência.`,
  },
  {
    number: 11,
    title: 'Urgências e emergências',
    content: `O Práxis NÃO é um serviço de emergência e NÃO é monitorado 24 horas por dia. Em situação de risco imediato à vida — sua ou de outra pessoa — não utilize o aplicativo. Acione imediatamente os serviços de emergência.

Em caso de crise, ligue para:
• SAMU: 192 (Serviço de Atendimento Móvel de Urgência)
• CVV: 188 (Centro de Valorização da Vida — atendimento 24h para sofrimento emocional e ideação suicida)
• Bombeiros: 193
• Pronto-socorro mais próximo

Se você está em sofrimento emocional intenso mas sem risco imediato à vida, entre em contato com seu profissional de saúde pelo telefone ou e-mail da clínica (não pelo chat do aplicativo, que pode não ser lido imediatamente).`,
    highlight: {
      type: 'emergency',
      text: 'SAMU 192 · CVV 188 · Bombeiros 193 — O app não é serviço de emergência 24h.',
    },
  },
  {
    number: 12,
    title: 'Direitos e deveres do paciente',
    content: `Como usuário do Práxis, você tem o direito de:
• Receber atendimento respeitoso e humanizado
• Ser informado sobre o seu diagnóstico, tratamento e prognóstico em linguagem acessível
• Manter sigilo de seus dados de saúde
• Recusar tratamento ou procedimento, com registro formal dessa recusa
• Ter acesso ao seu prontuário eletrônico

Você tem o dever de:
• Fornecer informações verídicas sobre sua saúde
• Comunicar mudanças relevantes (novo medicamento, internação, sintomas graves) ao profissional responsável
• Usar o canal de comunicação com respeito ao profissional e à equipe
• Não compartilhar suas credenciais de acesso ao aplicativo
• Notificar o Práxis imediatamente se suspeitar de acesso não autorizado à sua conta (suporte@praxis.saude.br)`,
  },
  {
    number: 13,
    title: 'Revogação de consentimento',
    content: `Você pode revogar seu consentimento de uso da plataforma a qualquer momento em Configurações › Conta › Excluir conta. A revogação encerra seu acesso à plataforma e dá início ao processo de anonimização dos seus dados, respeitados os prazos legais de retenção (20 anos para prontuário clínico, conforme CFM 1.821/2007).

Você pode revogar o consentimento de vínculo com um profissional específico em Configurações › Consentimentos, sem encerrar sua conta. Após a revogação, o profissional perde acesso a novos dados, mas registros clínicos anteriores podem ser retidos por obrigação legal.

Dados tratados com base legal distinta do consentimento (ex.: obrigação legal, tutela da saúde pelo profissional) não podem ser eliminados imediatamente, mas serão informados de forma transparente.`,
  },
  {
    number: 14,
    title: 'Canal de dúvidas e contato com o DPO',
    content: `Para questões sobre privacidade, proteção de dados e exercício dos seus direitos LGPD:

Encarregado de Proteção de Dados (DPO): privacidade@praxis.saude.br
Suporte técnico: suporte@praxis.saude.br
Resposta esperada: até 5 dias úteis (conforme Art. 18 da LGPD)

Para reclamações sobre tratamento de dados não resolvidas internamente, você pode acionar a Autoridade Nacional de Proteção de Dados (ANPD): www.gov.br/anpd

Para questões sobre o atendimento clínico (não sobre a plataforma), entre em contato diretamente com a clínica ou profissional de saúde responsável.`,
  },
  {
    number: 15,
    title: 'Aceite e vigência',
    content: `Ao aceitar estes termos, você declara:
• Ter lido e compreendido todas as cláusulas acima
• Ter 18 anos ou mais, ou estar representado por responsável legal
• Consentir com o tratamento dos seus dados pessoais sensíveis de saúde para os fins descritos
• Ter ciência de que o Práxis não é um serviço de emergência

Estes termos entram em vigor na data do aceite e permanecem válidos enquanto sua conta estiver ativa. Alterações materiais serão comunicadas por e-mail com 30 dias de antecedência, e um novo aceite poderá ser solicitado.

Este documento cobre o uso da plataforma Práxis. A relação assistencial com seu profissional ou clínica é regida por termos específicos desse prestador, complementares a este documento.

Versão ${TERMS_VERSION} — ${TERMS_DATE}`,
  },
];

export function termsAsPlainText(): string {
  return TERMS_CLAUSES.map(c =>
    `${c.number}. ${c.title.toUpperCase()}\n${c.content}${c.highlight ? `\n⚠ ${c.highlight.text}` : ''}`
  ).join('\n\n');
}

// ── Standalone page (public, no auth required) ────────────────────────────────

const SECTION_COLORS: Record<NonNullable<TermsClause['highlight']>['type'], string> = {
  warning:   'bg-amber-50  border-amber-300  text-amber-800',
  info:      'bg-blue-50   border-blue-300   text-blue-800',
  emergency: 'bg-red-50    border-red-400    text-red-800',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-3xl mb-3">⚖️</div>
          <h1 className="text-2xl font-bold mb-1">Termos de Uso e Política de Privacidade</h1>
          <p className="text-indigo-200 text-sm">
            Práxis — Plataforma de Acompanhamento Longitudinal de Saúde
          </p>
          <p className="text-indigo-200 text-xs mt-2">
            Versão {TERMS_VERSION} · {TERMS_DATE}
          </p>
        </div>
      </div>

      {/* Emergency banner */}
      <div className="bg-red-600 text-white px-4 py-3">
        <div className="max-w-2xl mx-auto text-sm font-semibold text-center">
          🚨 Em emergências: SAMU 192 · CVV 188 · Bombeiros 193 — O app NÃO é serviço 24h
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Table of contents */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Índice</p>
          <ol className="space-y-1">
            {TERMS_CLAUSES.map(c => (
              <li key={c.number}>
                <a
                  href={`#clause-${c.number}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {c.number}. {c.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Clauses */}
        {TERMS_CLAUSES.map(c => (
          <div
            key={c.number}
            id={`clause-${c.number}`}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className={`px-5 py-3 flex items-center gap-3 ${c.number === 11 ? 'bg-red-50' : 'bg-gray-50'} border-b border-gray-200`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                c.number === 11 ? 'bg-red-600 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {c.number}
              </span>
              <h2 className={`font-bold text-sm ${c.number === 11 ? 'text-red-800' : 'text-gray-900'}`}>
                {c.title}
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{c.content}</p>
              {c.highlight && (
                <div className={`rounded-lg border-l-4 p-3 text-sm font-medium ${SECTION_COLORS[c.highlight.type]}`}>
                  {c.highlight.type === 'emergency' && <span className="mr-1">🚨</span>}
                  {c.highlight.type === 'warning'   && <span className="mr-1">⚠️</span>}
                  {c.highlight.type === 'info'      && <span className="mr-1">ℹ️</span>}
                  {c.highlight.text}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center space-y-3 pb-8">
          <p className="text-xs text-gray-400">
            Práxis · Versão {TERMS_VERSION} · {TERMS_DATE}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/login" className="text-xs text-indigo-600 hover:underline">Entrar</Link>
            <Link to="/register" className="text-xs text-indigo-600 hover:underline">Criar conta</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
