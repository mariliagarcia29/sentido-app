# Plano de Modificações — Migração Sentido → Práxis

**Versão:** 3.2
**Data:** Julho 2026
**Origem:** Reunião com Alternamente Saúde em 03/05/2026 + materiais institucionais + mockups de design (maio 2026)

---

## 0. Sumário executivo

Este documento compila todas as decisões tomadas na reunião com o colega psiquiatra (Alternamente Saúde) e nos documentos institucionais associados, traduzindo-as em um plano concreto de modificações para o repositório `app_saude` (atualmente "Sentido"). A direção geral é: **transformar o app de um diário psiquiátrico em uma ferramenta multidisciplinar de acompanhamento longitudinal de saúde**, mantendo a estética humana já desenhada, com integração B2B a softwares de clínica e foco real no MVP clínico.

**Atualização v3.1 (jun/2026):** incorpora os mockups de design (`Práxis · Compilação · 3 temas`, `Práxis · Profissional · PDF`, `Práxis · Clínica · PDF`) com 98 telas validadas — Módulo A (Paciente · 53 telas · 3 temas), Módulo B (Profissional · 36 telas · tema Sério), Módulo C (Clínica · 9 telas · tema Sério). Seções 3, 5–6, 8.5 atualizadas; Módulo C (seção 15) adicionado; cronograma revisado.

**Atualização v3.2 (jul/2026):** Módulo C (seção 15 completo — 9 telas, ClinicModule, 5 migrações 027–031, 8 páginas frontend) implementado e concluído. Cronograma atualizado. Tarefas concluídas da seção 11 marcadas. Apêndice A atualizado com localização dos PDFs de design e status de implementação de todas as 98 telas.

As três mudanças mais estruturantes são:

1. **Rename** de Sentido → **Práxis** (decisão final da reunião — conotação filosófica e prática).
2. **Reescopo**: o app deixa de ser apenas paciente↔médico psiquiatra e passa a suportar acompanhamento longitudinal multidisciplinar (psiquiatria, psicologia, nutrição, educação física, enfermagem, etc.), com base nos seis pilares da medicina do estilo de vida.
3. **Reorientação técnica**: tirar do MVP o que adiciona complexidade sem retorno clínico (Apple Watch/wearables, agenda própria competindo com Google Agenda) e integrar via API com prontuários eletrônicos (Nim Saúde como primeiro alvo).

---

## 1. Renomeação e reposicionamento

### 1.1 De "Sentido" para "Práxis"

| Item | Ação |
|------|------|
| Nome do produto | `Sentido` → `Práxis` (variantes: "Praxis Mind" para versão clínica) |
| Frontend (`web/`) | Trocar logos, títulos, meta tags, favicon |
| Backend (`backend/`) | Atualizar `package.json`, e-mails transacionais, assinatura JWT issuer |
| Documentação | README.md, CONTRIBUTING.md, plano_app.md |
| Domínios em produção | Avaliar custo/benefício de migrar `sentido-app-demo.netlify.app` e `sentido-api.onrender.com`. Sugestão: manter URLs atuais por enquanto e fazer rename somente quando migrar para domínio próprio (`praxis.app`, `praxismind.com`, etc.) |
| Memória do projeto | Atualizar `memory/project_sentido.md` → `memory/project_praxis.md` |

### 1.2 Reposicionamento do produto

O Práxis deixa de ser "app de saúde mental" e passa a ser:

> "Plataforma de acompanhamento longitudinal de saúde, na interseção entre psiquiatria de evidência, medicina do estilo de vida e experiência organizada do paciente. Ferramenta para equipes multidisciplinares — não apenas para médicos."

**Os seis pilares da medicina do estilo de vida** (definidos pelo Alternamente, devem orientar o conteúdo do app):

1. Ciclo social e relacionamentos
2. Redução de danos de substâncias
3. Atividade física
4. Alimentação
5. Sono
6. Saúde mental e administração do estresse

Cada pilar vira **eixo de coleta e visualização** dentro do app. O check-in diário toca todos eles em formato curto; as escalas validadas e o pré-mapeamento basal aprofundam onde necessário.

---

## 2. Remoções do escopo (decisão da reunião)

| Item a remover | Motivo |
|----------------|--------|
| **Integração Apple Watch / HealthKit / Health Connect** | Complexidade alta, retorno clínico baixo no MVP. Move para "Mais tarde". |
| **Wearables em geral** (Fitbit, Garmin, etc.) | Mesma razão. Manter o módulo `wearables` no backend desativado/oculto para reuso futuro. |
| **Agenda própria com slots de horário** | Gera retrabalho para o médico (que já marca no Google Agenda + sistema da clínica). Substituir por integração via API com Nim Saúde. |
| **Telemedicina nativa (Twilio/Daily.co/WebSocket de vídeo)** | Não é prioridade do MVP clínico. Pode ser ofertada via link externo (Google Meet, Zoom) por enquanto. |
| **Exportação CSV "planilha"** | Decisão explícita: trocar o CSV por **PDF gráfico**. O formato planilha "não está agradando". |

> **Nota técnica:** Não deletar código. Mover para flags/feature toggles desativados para manter a opção de reativar quando o MVP estiver validado em clínica real.

---

## 3. Adições estruturantes

### 3.1 Onboarding clínico basal — fluxo de 8 passos

Substitui o cadastro atual. O paciente faz uma única vez, no início, para criar o "mapa inicial" que evita que dados futuros virem ruído. Inspirado no documento *Sistema mínimo de entrada do paciente* (Alternamente).

**UI implementada nos mockups:** fluxo linear de 8 passos (`Cadastro · X/8`) com botão "pular" em todos exceto o histórico de risco e a confirmação final. Após o passo 8, tela separada de vinculação a profissional ("Sem código? Continuar sozinha").

| Passo | Tela | Campos principais |
|-------|------|-------------------|
| **1/8** | Identificação | Nome completo, nome preferido (opcional), data de nascimento, CPF, e-mail, telefone |
| **2/8** | Contato | Canais preferidos (WhatsApp/E-mail/SMS/Telefone), restrições de privacidade |
| **3/8** | Motivo | Queixa principal (texto livre), o que espera da consulta (multi-seleção), urgência (autoavaliação: sem pressa → hoje) |
| **4/8** | Histórico | Diagnósticos atuais, internações, histórico de risco (já tive / tenho hoje / nunca) — **obrigatório** |
| **5/8** | Medicações e alergias | Medicações em uso (nome, dose, horário), alergias com grau de gravidade |
| **6/8** | Documentos antigos | Upload opcional de PDFs/fotos de exames |
| **7/8** | Termo geral + Permissões opcionais | Leitura obrigatória do termo (progresso visível). Permissões opcionais **NÃO pré-marcadas**: (1) lembretes de check-in por WhatsApp; (2) resumos semanais por e-mail; (3) dados anônimos em pesquisa clínica; (4) novidades do Práxis |
| **8/8** | Confirmação final | Declaração de veracidade + aceite do termo |

**Pós-cadastro — vinculação:**
- Tela de vinculação com profissional: paciente insere código institucional (formato `ALT · 7X29`) para associar à clínica/profissional
- "Sem código? Continuar sozinha" — uso solo sem vínculo é permitido desde o primeiro acesso

> **Princípio orientador (Alternamente):** "O sistema mais seguro não é o que pede mais assinaturas. É o que reduz zonas cinzentas." Um termo geral cobre o ordinário; checkboxes destacados cobrem o opcional/sensível; termos separados aparecem só quando muda risco, destinatário ou finalidade.

### 3.2 Check-in rápido (30 segundos · 4 perguntas) — coração do MVP

Substitui o registro atual de humor/sintomas por um fluxo **curto e diário**. Citação da reunião: *"o paciente não é estagiário do próprio prontuário."*

**Acesso na Home:** botão "Registrar" no card "Check-in de hoje · Como você está hoje? · 30 segundos · 4 perguntas".

Campos do check-in diário (mockup confirma 4 perguntas centrais):

| Campo | Formato definido nos mockups |
|-------|------------------------------|
| Humor | 5 estados: Radical / Bem / Mais ou menos / Mal / (Horrível implícito) — exibidos em calendário mensal por cor |
| Ansiedade | Escala 0–10 |
| Sono (horas da noite anterior) | Horas numéricas (ex.: 5,2h, 6,4h) |
| Medicação tomada hoje? | Sim / Não / Pulado / Não se aplica — *desativável* para quem não quer |

> **Nota sobre Energia:** campo previsto na seção 3.2 v3.0, não aparece como campo central nos mockups v3.1. Avaliar inclusão como campo optional de progressive disclosure.

**Visualização — Calendário do mês (tela A.2):**
- Cada dia colorido pelo estado de humor registrado (Radical, Bem, Mais ou menos, Mal)
- Contagem mensal por estado
- **Insights automáticos**: "Você teve mais dias radicais nas últimas duas semanas. Os dias difíceis se concentraram após noites com menos de 6h de sono."

**Regras**:
- Marcação de medicação deve ser **opcionalmente desligável** (rotinas corridas → dado mais limpo).
- Para quem mantém ativada, falhas geram alertas com **identificação de padrão** (ex.: "falhas concentradas no almoço").
- Sem variáveis em excesso. Se quiser aprofundar, paciente clica para abrir mais campos (progressive disclosure).
- Linguagem **não ansiogênica** — desvios bruscos disparam aviso ao médico, não notificação alarmante ao paciente.

### 3.3 Escalas científicas validadas (substituem os "marcadores caseiros")

Pendente de envio pelo Alternamente, mas estrutura confirmada pelos mockups:

| Escala | Aplicação | Gatilho / frequência padrão |
|--------|-----------|------------------------------|
| **PHQ-9** | Depressão | Mensal; gatilho: agendada |
| **GAD-7** | Ansiedade | Mensal; gatilho: agendada |
| **ISI** (Insomnia Severity Index) | Qualidade do sono | A cada 14 dias; gatilho: `sono < 5h × 3 noites consecutivas` |
| **AUDIT** | Uso de álcool | Semestral; gatilho: agendada |
| **EPDS** (Edinburgh Postnatal Depression Scale) | Saúde perinatal | Semanal; gatilho: `gestação ativa` ativada no perfil |
| **U9 (ou U5)** | Qualidade de vida geral | Trimestral |
| Escalas específicas por diagnóstico | (a definir) | Personalizadas pelo médico no perfil do paciente |

> **ISI** substitui o PSQI como escala de sono padrão nos mockups. **EPDS** é nova — cobre saúde da mulher perinatal, não mencionada na v3.0.

**Princípio**: as escalas **não entram no fluxo diário**. Entram em momentos específicos, quando a granularidade vale a pena. O paciente vê isso como "questionário do mês" — ritual claro, com retorno visível.

**Configuração por paciente (tela B.10 — Configurações escalas):** O profissional configura, para cada paciente, quais escalas aplicar, com que frequência e qual gatilho antecipa a próxima aplicação. Gatilhos disponíveis: agendada (padrão), clínico por dado (ex.: sono < 5h × 3), diagnóstico ativo no perfil.

**Personalização por diagnóstico** (sugestão da reunião): se o médico marca "depressão" no perfil, o app passa a aplicar PHQ-9. Se marca "alcoolismo", aplica AUDIT. Se marca "gestação ativa", aplica EPDS. Tornar o preenchimento direcionado, não genérico.

### 3.4 Camadas de mensuração (modelo Alternamente)

| Camada | Conteúdo | Status no MVP |
|--------|----------|---------------|
| **1. Desfechos clínicos** | humor, ansiedade, sono | ✅ Já no MVP |
| **2. Processos comportamentais** | regularidade de sono, atividade física, alimentação, uso de substâncias | 🔧 Adicionar gradualmente, alinhado aos 6 pilares |
| **3. Segurança** | ideação suicida, piora abrupta, abuso de substâncias, reações graves a medicamentos | ⚠️ **Obrigatória desde o início** |
| **4. IA assistiva** | rastreamento de efeitos colaterais conhecidos (ex.: rash da lamotrigina), interações medicamentosas | 🔮 Camada de IA — escopo a definir |

### 3.5 Resumo pré-consulta (Mind A1)

Geração automática de uma **síntese longitudinal** com o que aconteceu nos últimos 14, 30 ou 60 dias. Visível tanto para o paciente quanto para o médico.

**Tela principal — Resumo longitudinal (B.4 · tela 66):**
- Síntese gerada por IA com marcação "RESUMO AUTOMÁTICO · revisão humana pendente"
- Seletor de período: 14d / 30d / 60d / 90d
- Tendências de humor, ansiedade, sono com delta numérico e seta (▲▼)
- Lacunas detectadas (explicitadas em linguagem clara)
- Perguntas sugeridas para a consulta (numeradas, até 4)
- CTA "Iniciar consulta →"

**Tela secundária — Pré-triagem (B.4 · tela 67):**
- Lista de formulários e escalas respondidos pelo paciente no pré-consulta
- Cada item mostra escore + referência (ex.: "PHQ-9 · 14/27 · moderada")
- Texto livre de queixa atualizada (enviada pelo paciente antes da consulta)

**Tela de lacunas clínicas (B.4 · tela 68):**
Comparação automática entre prontuário e diretrizes para o perfil do paciente. Cada lacuna categorizada por tipo:

| Tipo | Ícone | Exemplo | Ação disponível |
|------|-------|---------|-----------------|
| **EXA** | Exame | HbA1c não medida há 6 meses | Recomendar |
| **ESC** | Escala | GAD-7 vencida há 12 dias | Aplicar agora |
| **CON** | Consulta especialista | Cardiologia sem retorno desde set/2025 | Considerar encaminhamento |
| **MED** | Medicação | Dose de sertralina não revisada em 60 dias | Avaliar |

Cada item pode ser: marcado como abordado · ignorado com justificativa.

> **Modelo de template completo:** seção 9 do documento *sistema-minimo-alternamente-saude.pdf* (Síntese Longitudinal Pré-Consulta — 12 blocos).

### 3.6 Plano de cuidado entre consultas

Transformar o app em **extensão do plano terapêutico**. Após cada consulta, o profissional define (tela B.6 · Plano terapêutico):

- **Medicações**: MANTER / ALTERAR / SUSPENDER com doses e horários explícitos
- **Psicoterapia**: profissional vinculado, modalidade, frequência, status
- **Hábitos**: tarefas claras com frequência (ex.: "Caminhada 30 min · 3× por semana", "Higiene do sono · sem tela após 22h · diária", "Respiração 444 antes de dormir · diária")
- **Exames solicitados**: nome + prazo em dias
- **Encaminhamentos**: especialidade, médico, motivo
- **Retorno**: data, duração, modalidade (presencial/remoto)
- **Combinados clínicos** (ex.: "se ideação evoluir para ativa, alertar equipe")

O paciente vê isso como "Meu plano de hoje" na Home — lista das tarefas do dia com check (medicação tomada, pendente, etc.).

**Templates de plano reutilizáveis (tela B.10 · tela 88):** O profissional salva modelos de plano por condição clínica e aplica em 1 clique:

| Template | Itens | Uso |
|----------|-------|-----|
| Depressão moderada · sertralina | 4 | 14× usado |
| Insônia crônica · TCC-I | 5 | 9× |
| Ansiedade generalizada · 1ª linha | 6 | 22× |
| Saúde da mulher · perinatal | 8 | 4× |

Templates são editáveis, duplicáveis e aplicáveis diretamente ao paciente em consulta.

### 3.7 Dashboard médico simples (sem "telas lindas e inúteis")

Substituir o dashboard atual por algo enxuto (telas B.2):

**Dashboard do dia (tela 57):**
- Cards de resumo: consultas do dia, alertas, mensagens novas, escalas pendentes
- Seção "precisam de atenção agora" com os pacientes em risco, ordenados por score
- Agenda do dia compacta (nome, tipo de consulta, horário)

**Triagem clínica (tela 59):**
- Fila de todos os pacientes priorizada por **score clínico = risco × tendência × adesão** (0–100)
- Score visível e destacado; cada paciente com etiqueta de motivo (risco alto · tendência · adesão · sintoma)
- Filtros disponíveis

**Exemplos de scores (mockup):**

| Score | Paciente | Motivo | Dado |
|-------|----------|--------|------|
| 92 | Vânia Rocha | risco alto | GAD-7: 18 · piora há 2 semanas |
| 88 | Marília Costa | risco alto | Ideação passiva · check-in hoje |
| 71 | Pedro Almeida | tendência | PHQ-9: 14 (era 8 há 30d) |
| 58 | Sofia Bertini | adesão | Adesão Sertralina: 38% |
| 44 | Caio Lima | sintoma | Sono < 5h por 7d seguidos |

**Agenda clínica (tela 58):** Visualização dia/semana/mês. Cada consulta com nome, tipo e duração. Urgências marcadas com `!`.

> Diretriz: "Resumo primeiro, detalhe depois. Triagem antes de BI decorativo."

### 3.8 Documentos prévios — análise + descarte

Funcionalidade nova: o app **lê PDFs** (exames, receitas, laudos), **extrai dados estruturados** (TSH, glicemia, doses, datas) e **descarta o PDF** após extração.

- Foco em **dado, não em documento**.
- Dados entram na timeline do paciente (visualizável como gráfico longitudinal — ex.: variação de TSH ao longo de 5 anos).
- Quando autorizado, IA pode auxiliar a estruturação. **IA não diagnostica**. Toda síntese gerada por IA exige revisão humana antes de virar registro clínico.
- Implementação: bom leitor de PDF + parser estruturado + (opcional) LLM para classificação. Avaliar `pdfjs-dist`, `pdf-parse`, OCR se necessário (Tesseract / Google Document AI).

**Extração com score de confiança (telas B.8 · 81-82):**

Lista de documentos com status: `extraído` / `em revisão` / `arquivado`. Cada documento exibe score de confiança global (ex.: 98%).

Tela de revisão por campo (revisão de extração):
- Miniatura do documento original ao lado
- Campos extraídos com confiança por campo: Tipo (99%), Paciente (98%), Data coleta (97%), Laboratório (91%), Médico solicitante (74%)
- Valores de exame com referências (ex.: Hemoglobina: 13,4 g/dL · ref 12,0–16,0)
- Ação: confirmar extração (libera dados para o prontuário)

**Exames com mini-gráficos (tela B.3 · 61):** Cada exame recorrente (TSH, Glicemia, HbA1c, LDL, Hemoglobina, Vitamina D) exibe mini sparkline de evolução temporal com status `normal` / `atenção`. Seletor de período: 90d / 180d / 1 ano / total.

### 3.9 Meditação guiada e sons ambientais (sugestão Alternamente)

- **Técnica 444** de respiração (4s inspira, 4s segura, 4s expira) com voz guiada
- Áudios curtos (3 min, estilo Headspace) para crises e momentos de estresse
- Áudios para pessoas próximas que oferecem apoio
- Sons ambientais ligáveis/desligáveis (chuva, floresta, mar) — **opcional, padrão desligado**
- **Pesquisar bancos de meditações** (tarefa Marília): Insight Timer, Calm, Smiling Mind têm conteúdos abertos. Avaliar licenciamento.

> Inspiração estética: meditação guiada da Netflix, Headspace.

### 3.10 Três modos de design (personalização visual)

Para dialogar com personalidade do usuário e aumentar adesão:

| Modo | Estética | Público alvo |
|------|----------|--------------|
| **Clássico** | Sóbrio, espaços brancos, tipografia serif sutil | Pacientes que preferem aparência médica/clínica |
| **Sério** | Minimalista, foco em dados e gráficos, sem ornamento | Pacientes técnicos / profissionais de saúde como usuários |
| **Fofo** | Espíritos do Studio Ghibli, aquarela, paleta atual do Sentido | Padrão atual — para quem se conecta com leveza |

Implementar como tema selecionável em configurações. Estrutura técnica: variáveis CSS + tokens de design + assets condicionais.

---

## 4. Integração com Nim Saúde (substitui agenda própria)

Decisão da reunião: em vez de o app gerenciar consultas, ele **lê** as consultas já agendadas no software de prontuário da clínica via API.

| Item | Definição |
|------|-----------|
| Sistema alvo | **Nim Saúde** (citado pelo Alternamente como tendo API aberta) |
| Dado lido da API | Lista de consultas agendadas, status, profissional, sala, link de teleconsulta se houver |
| Dado escrito | (a definir após análise da API — possivelmente: confirmação de presença, anexos do paciente, devolutivas) |
| Vantagem estratégica | Modelo replicável para outras clínicas → vendabilidade B2B |
| Tarefas pendentes | Aguardar documentação da API (Alternamente vai compartilhar). Marília vai pesquisar fontes adicionais. |

Manter o módulo `appointments` no backend, mas refatorar para suportar **fontes externas** (Nim Saúde como adapter). Modelo: `appointments.source = 'native' | 'nimsaude' | 'manual'`.

---

## 5. LGPD, consentimento e identidade

### 5.1 Dois consentimentos distintos

Decisão da reunião:

1. **Consentimento de uso geral do app** (LGPD básico — base legal de tratamento de dados sensíveis para tutela da saúde)
2. **Consentimento de vínculo com profissional/instituição** (autoriza compartilhamento clínico com profissional ou clínica específica)

**Implementação**:
- Tela 1 do onboarding após criação da conta: aceite do termo geral (checkbox **não pré-marcado**)
- Tela de "vincular profissional": gera vínculo via código/link inicial fornecido pelo profissional. Aceite separado.
- Uso solo (sem vínculo médico) é permitido — incentiva registro contínuo. Vide *"Diário Médico Independente"* na ata.

### 5.2 Sistema de cadastro melhorado (tarefa explícita Marília)

| Tela | Função |
|------|--------|
| Tela única de seleção | Escolher tipo de cadastro: Paciente / Profissional / Clínica |
| Tela específica paciente | Bloco A do onboarding (mínimo viável + termo + checkbox LGPD) |
| Tela específica profissional | Nome, especialidade, CRM/CRP/CREF/CRN (conforme tipo), e-mail, instituição associada (opcional) |
| Tela específica clínica | CNPJ, registro de PJ equivalente (CRM-PJ), responsável técnico |
| Validação LGPD | Checkbox **obrigatório**, **não pré-marcado**, com link para o termo integral antes do envio |

Sugestão da reunião: clínicas também têm registro equivalente ao CRM (CRM-PJ). Ampliar o app para incluir psicólogos, educadores físicos, nutricionistas e enfermeiros — o mecanismo é basal para acompanhamento de saúde em geral, não específico de psiquiatria.

### 5.3 Código único de paciente (modelo Alternamente)

Adotar formato de codificação para uso interno e em IA:

```
ALT26-0042-X7
│   │   │    │
│   │   │    └── sufixo de controle aleatório
│   │   └─────── número sequencial interno
│   └─────────── ano de criação
└─────────────── prefixo institucional
```

Variações (nomenclatura interna / banco):
- `ALT26-0042-X7` — código geral
- `ALTIA26-0042-X7` — uso em IA / pseudonimização
- `ALTPR26-0042-X7` — procedimento
- `ALTFAM26-0012-K9` — núcleo familiar

**Formato na UI dos mockups:** Os mockups implementam um formato simplificado mais legível para o usuário:
```
ALT · 7X29
```
Onde `ALT` = prefixo institucional (3 letras maiúsculas, configurável pela clínica) e `7X29` = 4 dígitos alfanuméricos gerados. Validade: 14 dias. Reutilização: não — um código por paciente. Quem pode gerar: Secretária + Médico + Admin.

> O formato longo (ALT26-0042-X7) é o identificador permanente no banco; o formato curto (ALT · 7X29) é o código temporário de convite enviado ao paciente. Eles coexistem com funções diferentes.

**Para o Práxis**: prefixo configurável por instituição (cada clínica tem o seu — `ALT` para Alternamente, `XXX` para a próxima). Banco terá tabela `institution_codes` com chave de reidentificação separada e acesso restrito. Detalhe completo: seção 7 de *sistema-minimo-alternamente-saude.pdf*.

### 5.4 Matriz mínima de acesso

Aplicar a matriz da seção 10 do mesmo PDF:

| Perfil | Nome real | Prontuário completo | Documentos antigos | Pode usar IA |
|--------|-----------|---------------------|--------------------|---------------|
| Médico responsável | Sim | Sim | Sim | Sim, se autorizado |
| Psicóloga | Sim | Parcial / necessário | Parcial / necessário | Sim, se autorizado |
| Enfermeira | Sim | Parcial / necessário | Parcial / necessário | Sim, se função definida |
| Secretária | Sim | Não | Apenas conferência operacional | Não |
| Financeiro | Sim | Não | Não | Não |
| IA | **Não, sempre que possível** | Não | Apenas conteúdo pseudonimizado | Não decide |
| Advogado externo | Só se necessário | Não por padrão | Só escopo autorizado | Não |

Implementar via RBAC granular no backend (`@Roles` + `@FieldGuards`) e RLS no Postgres.

### 5.5 SUS / RNDS (longo prazo, não MVP)

Tarefa Alternamente: pesquisar estratégia do SUS para compilação e interconexão de dados (RNDS — Rede Nacional de Dados em Saúde).

**Decisão de Marília na reunião**: esperar implementação nacional consolidar antes de integrar — regulamentações brasileiras mudam com frequência. Manter no radar; **não entra no MVP**.

---

## 6. IA — escopo, escolhas e limites

### 6.1 Princípios (não negociáveis)

Citação direta da reunião e dos documentos:

- IA **organiza, resume, estrutura, sinaliza**.
- IA **não diagnostica, não prescreve, não decide conduta, não substitui profissional**.
- Todo material gerado por IA exige **revisão humana** antes de uso clínico.
- IA opera com dados **pseudonimizados** sempre que possível (código `ALTIA` em vez de nome).
- Em divergência: prevalece documento original + julgamento clínico + conversa com paciente.

### 6.2 Casos de uso priorizados

| Caso | Uso | Prioridade |
|------|-----|------------|
| Estruturação de PDFs antigos | OCR + extração de campos clínicos | Alta |
| Síntese pré-consulta | Resumir 30 dias de check-ins + escalas + eventos | Alta |
| Sinalização de efeitos colaterais conhecidos | Match entre medicação ativa e queixas (ex.: lamotrigina + rash → alertar) | **Alta — segurança** |
| Cobertura clínica da consulta (Praxis Mind) | Score 0–100% de categorias cobertas durante a consulta | Média |
| Transcrição de consulta | Áudio → texto estruturado por categoria SOAP | Média (requer consentimento específico) |
| Marcadores prosódicos / coerência narrativa | Análise paralinguística como apoio | Baixa (futuro) |

### 6.3 IA do app — Open Evidence + Auditoria de IA

**Decisão:** o Práxis adota o **Open Evidence** como motor de IA médica oficial do app. Citado pelo Alternamente como ferramenta que cita informações com base em artigos de revistas clínicas, é a opção mais alinhada aos princípios da seção 6.1 (evidência, rastreabilidade, não-alucinação).

| Item | Definição |
|------|-----------|
| Ferramenta | **Open Evidence** (https://www.openevidence.com) |
| Justificativa clínica | Respostas com citação direta de literatura científica revisada por pares — reduz alucinação e dá rastreabilidade ao profissional |
| Onde entra no app | Sinalização de efeitos colaterais conhecidos (Camada 3 — segurança), apoio à decisão clínica do médico, suporte às sínteses pré-consulta |
| Onde **não** entra | Não conversa direto com paciente, não diagnostica, não prescreve. Toda resposta vai para o profissional revisar antes de virar conduta. |
| Tarefas pendentes | (1) Verificar se Open Evidence oferece **API pública** ou se a integração inicial será via web; (2) avaliar termo de uso contratual quanto a LGPD e dados sensíveis; (3) definir fluxo de pseudonimização antes de envio (códigos `ALTIA`); (4) implementar log de cada consulta à IA para auditoria. |

**Tipos de alerta definidos na UI (tela B.7 · tela 78):**

| Categoria | Severidade | Exemplo | Ação |
|-----------|-----------|---------|------|
| INTERAÇÃO MEDICAMENTOSA | média | Sertralina + Levotiroxina: monitorar TSH | aceitar e citar na nota · ignorar com justificativa |
| EFEITO COLATERAL CONHECIDO | baixa | Náusea matinal com sertralina nos primeiros 14 dias | aceitar · ignorar |
| DIRETRIZ | informativa | PHQ-9 > 10 + ideação passiva → considerar aumento de dose | aceitar · ignorar |
| ATENÇÃO | alta | Aperto retroesternal + glicemia em alta → descartar isquemia | aceitar · ignorar |

Cada alerta exibe: fonte, autores, journal, ano. Tela de evidências citadas (tela 79) permite filtrar por tipo (estudos, diretrizes, meta-análises) e copiar citação.

**Auditoria de IA (tela B.7 · tela 80):** Toda invocação de IA é registrada e exige decisão humana. Tipos de registro:

| Tipo | Modelo IA | Exemplo |
|------|-----------|---------|
| `mind` | mind-2.1 | Sugestão de pergunta, resumo pré-consulta |
| `risk` | risk-1.4 | Detecção de risco (automática) |
| `doc` | doc-1.0 | Extração de exame |

Decisões possíveis: aceita · revisada · ignorada. Log imutável para auditoria clínica e compliance.

**Fallback / segunda camada** (apenas para tarefas que não exigem evidência clínica — ex.: parsing de PDF, sumarização de texto livre, OCR): provedores generalistas com cláusula contratual de não-retenção e não-treinamento (OpenAI Enterprise, Anthropic API com BAA equivalente). Esses **não substituem** o Open Evidence em decisões clínicas.

### 6.4 Conformidade e responsabilidade

Esclarecimento da reunião: IAs já têm criptografia em trânsito; uma falha de vazamento seria responsabilidade da IA, não do app. **Garantir contratualmente**: usar provedores com termo de uso compatível com saúde (ex.: OpenAI Enterprise sem retenção, Anthropic com cláusula de não-treinamento). Documentar isso no termo de uso da Práxis.

---

## 7. Exportação — de CSV para PDF gráfico

Substituir o módulo de export atual (planilha CSV) por **PDF gráfico**.

| Característica | Definição |
|----------------|-----------|
| Formato | PDF A4, layout "diário tipo Daily" / paleta atual do Sentido |
| Conteúdo | Resumo do período + gráficos longitudinais (humor, ansiedade, sono, adesão) + lista de eventos + escalas aplicadas + observações |
| Periodicidade | Sob demanda (paciente escolhe período) + automático antes de consulta |
| Implementação | Reaproveitar módulo `pdf` do plano original (Puppeteer + template HTML). Trocar template para layout gráfico em vez de tabular. |
| Acesso | URL temporária com expiração (24h, igual ao plano v2) |
| Tarefa Marília | "Alterar formato de download da planilha para PDF" — agendado |

> **Nota:** manter a opção CSV no backend para auditoria e dump técnico, mas remover do frontend do paciente.

---

## 8. Termos de uso (tarefa Marília + Alternamente)

Escrever os termos. Estrutura de referência: seção 4 de *sistema-minimo-alternamente-saude.pdf* — 15 cláusulas:

1. Quem somos
2. Como funciona o atendimento
3. Comunicação com a clínica
4. Prontuário e registro clínico
5. Documentos médicos prévios
6. Privacidade e LGPD
7. Equipe envolvida
8. Tecnologia, transcrição e IA
9. Dados pseudonimizados e indicadores
10. Agendamento, cancelamento e no-show
11. Urgências e emergências (com **aviso explícito** de que o app não é serviço 24h, com SAMU 192 e instruções claras)
12. Direitos e deveres do paciente
13. Revogação de consentimento
14. Canal de dúvidas
15. Aceite

**Adaptar para o Práxis**: a clínica é variável (cada profissional/clínica que adota o Práxis preenche o seu próprio cabeçalho). Termo geral do Práxis cobre o uso da plataforma; termo específico da clínica cobre a relação assistencial.

---

## 8.5 Visão "Praxis Mind" — módulos clínicos completos (Nim Saúde resumo)

O documento `Nim Saude - resumo.docx` consolida a visão de produto do colega para o que ele chama de **Praxis Mind**: um sistema clínico estruturado em torno do encontro terapêutico, com módulos espelhados para o profissional e para o paciente. Esta visão estende o MVP em direção a uma plataforma assistencial completa. Incorporamos abaixo como **arquitetura-alvo de longo prazo**, sinalizando o que entra no MVP e o que fica para depois.

### 8.5.1 Premissas do Praxis Mind

- O acompanhamento atual em saúde mental no Brasil é fragmentado, sem monitoramento contínuo, com risco de condutas inadequadas e resposta tardia a sinais de agravamento. O Praxis Mind responde a isso integrando autorrelatos, dados clínicos e informações longitudinais.
- **Padronização longitudinal de informações médicas** — adoção de dicionário de dados padronizado (vocabulário clínico estruturado).
- **Interação médico-paciente** como foco central — o app reduz ruído de comunicação e dependência exclusiva da memória do paciente, especialmente em sofrimento psíquico.
- **Validade legal — entra no MVP**: integração com **assinatura digital gov.br vinculada ao CRM** do profissional, para que toda nota clínica fechada (`clinical_notes.finalized_at`), receita e relatório tenha **validade legal de prontuário médico**. Profissional autentica via gov.br com seu certificado digital ICP-Brasil ou via login gov.br nível Prata/Ouro; o sistema valida o número do CRM contra a base do CFM e registra a assinatura no documento. Sem assinatura válida, o documento permanece como rascunho — não vira prontuário oficial.
- **Estrutura de banco**: modelos diferenciados para perfil do paciente e perfil do médico, preparados para uso de longo prazo, com facilidade de navegação e geração de conclusões.

### 8.5.2 Módulo Médico/Psicólogo

#### A1. Pré-consulta
*Objetivo: preparar o profissional para o encontro clínico, reduzindo carga cognitiva e tempo de revisão.*

- **Resumo longitudinal** — síntese automática dos últimos eventos relevantes: sintomas-chave, resposta ao tratamento, efeitos adversos, adesão, mudanças sociais/familiares, indicadores de risco. *(MVP — já previsto na seção 3.5)*
- **Linha do tempo clínica** — visualização estruturada de medicações (dose, datas, ajustes), escalas aplicadas, eventos clínicos relevantes. *(MVP)*
- **Pré-triagem do paciente** — ingestão estruturada de dados prévios à consulta: formulários de primeira consulta ou follow-up, escalas (PHQ-9, GAD-7, etc.), queixas atuais e objetivos. *(MVP)*

#### A2. Durante a consulta (Mind A2 — telas B.5 · 69–72)
*Objetivo: registrar conteúdo clínico sem interferir no vínculo terapêutico.*

- **Editor de notas SOAP em tempo real (tela 69):** Abas S/O/A/P. Auto-salvo a cada 8s. Sugestão de próxima pergunta gerada por IA em tempo real — profissional escolhe: usar · outra · desativar.
- **Score de cobertura clínica em tempo real (tela 70):** Medidor 0–100% atualizado durante a consulta. Categorias avaliadas: História atual, Sintomas afetivos, Sono, Risco, Adesão, Função social, Suporte familiar, Físico. Sugestão automática ao atingir cobertura baixa em categoria importante.
- **Tags comportamentais — MSE (tela 71):** Registro padronizado de Exame do Estado Mental por tags (vocabulário clínico estruturado):
  - **Afeto:** triste · ansioso · eutímico · irritado · embotado
  - **Discurso:** fluente · monossilábico · logorreico · empobrecido
  - **Comportamento:** inquieto · calmo · choroso · evasivo
  - **Cognição:** orientado · concentrado · memória ok · pensamento lento
  - Gera **resumo automático** do MSE em linguagem clínica a partir das tags selecionadas
- **Áudio + transcrição (tela 72):** Captura de áudio convertida em transcrição ao vivo (Dra./Paciente identificados). Consentimento específico registrado com data/hora. "Áudio é deletado após transcrição." *(Pós-MVP — exige consentimento específico)*

#### A3. Pós-consulta (Mind A3 — telas B.6 · 73–77)
*Objetivo: qualificar o fechamento clínico com eficiência e segurança.*

- **Editor SOAP (tela 73):** Nota estruturada em S/O/A/P com auto-salvo. Enquanto não assinada = `rascunho · não oficial`. Profissional pode editar até o momento da assinatura.
- **Plano terapêutico estruturado (tela 74):** Medicações (MANTER/ALTERAR/SUSPENDER), psicoterapia ativa, hábitos prescritos, exames solicitados com prazos, encaminhamentos, data de retorno. *(MVP — seção 3.6)*
- **Suporte à decisão clínica (tela B.7):** Alertas Open Evidence com 4 categorias (ver seção 6.3). *(MVP — Camada 3 da seção 3.4)*
- **Assinatura digital (tela 75):** Fluxo em 4 passos: Validar CRM → Escolher método → Autenticar gov.br → Assinar. Três métodos disponíveis:
  - `gov.br · selo prata` (mínimo exigido)
  - `ICP-Brasil · A3 token`
  - `Certificado em nuvem`
  Nota não assinada = rascunho sem validade legal. Assinatura vincula CRM validado ao documento com hash e timestamp.
- **Confirmação de assinatura (tela 76):** Exibe: paciente, profissional + CRM, método, hash, status `oficial · válido`. Ações: "Baixar PDF" · "Liberar ao paciente".
- **Devolutiva ao paciente (tela 77):** Gerada por IA a partir da nota clínica, em linguagem simples e acolhedora. O profissional revisa e edita antes de liberar. Inclui: o que foi discutido, o que vamos fazer, combinados importantes. Linguagem não técnica, em primeira pessoa.

### 8.5.3 Módulo Paciente

#### B1. Pré-consulta
- Onboarding e consentimentos. *(MVP — seção 3.1)*
- Preenchimento de formulários e escalas. *(MVP — seção 3.3)*
- Upload de exames e documentos. *(MVP — seção 3.8)*

#### B2. Durante a consulta
- Participação **passiva e opcional**: confirmação de dados, checklist de objetivos previamente definidos.

#### B3. Pós-consulta
- **Canal seguro de mensagens (telas B.9 · 83-85):** Caixa de mensagens multi-paciente com filtros (risco · não lidas · todas · arquivadas). Conversa individual com contexto clínico da paciente visível (alertas ativos, estado de triagem). **Respostas rápidas configuráveis** por categoria com variáveis:
  - `agendamento`: "Confirmando sua consulta amanhã às {hora}."
  - `medicação`: "Pode tomar com alimento se a náusea voltar."
  - `risco`: "Estou aqui. Você consegue me contar mais?" / "Em caso de emergência, ligue 188 (CVV) ou 192."
  - `adesão`: "Sem julgamento. Vamos revisar juntos no nosso próximo encontro."
- **Triagem de risco com escalonamento** — direciona para condutas adequadas conforme gravidade (auto-orientação → contato com clínica → emergência/SAMU).
- **Dashboard longitudinal** integrado: sintomas, escalas, sono, humor, medicações, eventos relevantes. *(MVP — base já prevista na seção 3.7 versão paciente)*

### 8.5.4 Camadas interpretativas avançadas (futuro — pós-piloto)

O Praxis Mind incorpora camadas de Psicologia Clínica e Neuropsicologia como **apoio interpretativo**, sem substituir o julgamento profissional. Estas funcionalidades **não entram no MVP** — ficam como roadmap de longo prazo, exigindo validação clínica robusta antes de implementação.

| Camada | Conteúdo | Quando |
|--------|----------|--------|
| **Apoio às condutas clínicas** | Sinaliza que condutas não são universais (ex.: nem todo TEPT demanda exposição inicial). Apoia raciocínio diferencial entre estabilização vs. processamento, fortalecimento vs. intervenções evocativas. **Não recomenda técnicas** — aponta fatores de atenção. | Pós-MVP |
| **Triangulação psicofarmacológica e psicológica** | Organizador de correlações entre medicações em uso, associações, possíveis efeitos cognitivos/emocionais/comportamentais descritos na literatura. Evita leituras reducionistas. | Pós-MVP — bom alvo para Open Evidence |
| **Marcadores prosódicos e paralinguísticos** | Análise de velocidade da fala, pausas, continuidade vs. fragmentação, alterações de volume e entonação, quebras de ritmo. Indicadores de estado emocional, ativação autonômica, fadiga. Permite comparações longitudinais intraindividuais. | Roadmap longo prazo — exige captura de áudio (A2) |
| **Incongruência narrativa e coerência do discurso** | Sinaliza contradições internas, rupturas temporais, mudanças abruptas de posicionamento, diferença entre conteúdo verbal e marcadores emocionais. Indicadores de dissociação, conflito interno, defesa, sobrecarga cognitiva. | Roadmap longo prazo |
| **Pré-mapeamento neuropsicológico funcional** | Observação no discurso de funções atencionais (dispersão, perseveração, oscilação, sustentação), funções executivas narrativas (organização, planejamento, inibição, flexibilidade), memória (coerência temporal, fragmentação, recuperação episódica) e fadiga cognitiva (queda de organização, pausas, clareza). | Roadmap longo prazo |
| **Camada transdiagnóstica** (Psicologia Baseada em Processos) | Padrões: rigidez × flexibilidade, capacidade reflexiva/mentalização, posição ativa × passiva, tolerância à frustração, integração corpo-emoção-cognição, regulação emocional. Acompanhados longitudinalmente; intraindividuais; indicadores de evolução além de sintomas. | Roadmap longo prazo |
| **Motivação, identidade e mudança** | Identifica no discurso: motivação para mudança, ambivalência, senso de identidade, afetos predominantes, coerência do self narrativo. Avalia trajetória de mudança, não apenas presença/ausência de sintomas. **Especialmente relevante em tratamentos complexos** (ex.: pacientes em uso de cetamina). | Roadmap longo prazo |

> **Princípio orientador (do documento Nim Saúde):** todas essas camadas são tratadas como **hipóteses clínicas** e **apoio à observação**, nunca diagnóstico. Reforçam que a decisão é **sempre do profissional**.

### 8.5.5 Implicações para o cronograma do MVP

A maior parte das funcionalidades centrais do Praxis Mind (módulos A1, A3, B1, B3) já está coberta pelo cronograma das seções 3 e 12. As principais **adições** que entram no MVP a partir desta visão:

- Vocabulário clínico estruturado / dicionário de dados (sprint A ou B — base para todas as outras tabelas)
- **Canal seguro de mensagens** entre paciente e equipe (sprint E ou F — alternativa estruturada ao WhatsApp)
- **Devolutiva ao paciente** revisada pelo médico (sprint F — junto com PDF gráfico e resumo pré-consulta)
- **Suporte à decisão clínica** com alertas de interação medicamentosa via Open Evidence (sprint H)
- **Assinatura digital gov.br + CRM** para validade legal de prontuário (sprint G ou H — entra no MVP, não é roadmap futuro)

Funcionalidades de **transcrição de consulta** (A2) e **camadas interpretativas avançadas** (8.5.4) ficam fora do MVP — exigem maturidade do produto, validação clínica e definição precisa de escopo IA.

---

## 9. Refazer o desenho basal (tarefa Marília)

> "Refazer o desenho basal do projeto para incluir os elementos de saúde longitudinal."

Etapas práticas:

1. Atualizar `plano_app.md` (v2.0 → v3.0) refletindo este documento.
2. Atualizar diagramas de arquitetura: incluir os 6 pilares como dimensões transversais; adicionar adapter de Nim Saúde; remover/recolher módulos de wearables e telemedicina nativa.
3. Atualizar modelagem de banco:
   - Nova tabela `institutions` (clínicas, com prefixo de código próprio)
   - Nova tabela `professional_profiles` (especialidade, registro, vínculo a instituição)
   - Nova tabela `patient_codes` (chave de reidentificação ALT26-XXXX-XX, com `key_holder_role`)
   - Nova tabela `care_plans` (plano entre consultas — tarefas, frequência, escalas)
   - Nova tabela `lifestyle_pillars_snapshots` (estado dos 6 pilares ao longo do tempo)
   - Nova tabela `validated_scales` + `scale_responses` (PHQ-9, GAD-7, U9, etc.)
   - Nova tabela `pre_consultation_summaries` (snapshots de 14/30/60 dias)
   - Nova tabela `imported_documents` (extraído do PDF, sem o arquivo)
4. Refazer fluxograma operacional do app refletindo: onboarding basal → check-in diário → escalas periódicas → upload opcional de documentos → resumo pré-consulta → consulta (na clínica, fora do app) → ajuste de plano → ciclo recomeça.

---

## 10. Plano de execução do colega (Alternamente Saúde)

Decisões da reunião sobre como o colega vai colaborar:

- **Não vai aprender a codar** — concentra-se na visão de médico.
- Vai usar o app por alguns meses como "usuário-zero" (versão usável só para ele) antes de abrir ao público.
- Vai compilar e compartilhar ideias **via pasta no Drive** (Alternamente compartilhará).
- Marília deve **pedir ajuda direta**: dizer exatamente quais tarefas ajudam, evitar excesso de informação.
- Comunicação clara > proatividade dispersa.

**Implicação para o repositório**: criar um **canal estruturado de feedback do colega** (issues no GitHub com template, ou planilha no Drive compartilhado). Toda nova funcionalidade clínica passa por validação dele.

---

## 11. Tarefas próximas (compilação da ata)

### Marília Garcia
- [x] Remover Apple Watch / wearables do protótipo (priorizar simplicidade do MVP)
- [ ] Pesquisar banco de dados de meditações (licenciamento + qualidade)
- [x] Alterar formato de download de planilha CSV para **PDF gráfico**
- [ ] Verificar API / forma de integração do **Open Evidence** (IA médica oficial do app) e termo contratual quanto a LGPD
- [x] Melhorar sistema de cadastro: tela única de seleção de tipo + telas específicas + checkbox LGPD obrigatório
- [ ] Escrever termos de uso (em parceria com Alternamente)
- [x] Refazer desenho basal incluindo saúde longitudinal
- [x] Renomear de Sentido → Práxis em todo o repositório

### Alternamente Saúde
- [ ] Compartilhar escalas validadas (ansiedade, depressão, sono, U9)
- [ ] Enviar documentação da API e exemplo de integração do **Nim Saúde**
- [ ] Pesquisar estratégia de implementação SUS / RNDS
- [ ] Validar uso clínico do **Open Evidence** (IA escolhida) — casos de uso prioritários, limites e exemplos reais
- [ ] Compartilhar informações via pasta Drive
- [ ] Estabelecer escopo específico de uso da IA médica no app
- [ ] Escrever termos de uso (em parceria com Marília)

---

## 12. Cronograma sugerido (alto nível)

Início: 30 jun 2026 · Piloto alvo: mar/2027 · Atualizado: 16 jul 2026  
Detalhamento técnico completo em `plano_app.md` seção 19.

**Legenda:** ✅ Concluído · 🔄 Parcial · ⬜ A iniciar

| Sprint | Período | Status | Entrega principal |
|--------|---------|--------|-------------------|
| **A — Fundação** | 30 jun – 13 jul | ✅ | Rename Sentido → Práxis em todo o repositório. Wearables/telemedicina fora da navegação. Migrações 023–025. Documentação e memórias atualizadas. Issue templates GitHub. |
| **B — Onboarding e LGPD** | 14 – 27 jul | 🔄 | Fluxo de cadastro refatorado (tela única de seleção + telas específicas). Onboarding basal 8 passos. LGPD checkbox obrigatório. Código `ALT · XXXX`. _(Pendente: termos de uso v1)_ |
| **C — Check-in rápido** | 28 jul – 10 ago | ✅ | CheckInModal multi-step (humor/ansiedade/sono/medicação/reação/segurança/pilares comportamentais). Calendário mensal colorido por humor na DashboardPage. Insights automáticos de padrão (correlação sono/humor, adesão, média de sono). Toggle de medicação nas configurações do paciente. Migração 032 (campos comportamentais). |
| **D — Escalas validadas** | 11 – 24 ago | 🔄 | PHQ-9, GAD-7, ISI, AUDIT, EPDS, U9 (backend + frontend). _(Pendente: gatilhos clínicos configuráveis + visualização longitudinal)_ |
| **E — Plano de cuidado** | 25 ago – 7 set | ✅ | "Meu plano de hoje" na DashboardPage com card de preview + link "Ver completo". MyCarePlanPage (`/meu-plano`): medicações, hábitos, psicoterapia, exames, encaminhamentos, combinados clínicos, observações, retorno. Templates e edição pelo médico via CarePlanTab (SoapEditorPage + PatientSummaryPage). |
| **F — Resumo pré-consulta + PDF gráfico** | 8 – 21 set | 🔄 | Síntese 14/30/60/90 dias com lacunas EXA/ESC/CON/MED. PDF gráfico Puppeteer. Devolutiva ao paciente. _(Parcial: devolutiva + ExportPage feitas; template completo pendente)_ |
| **G — Perfil longitudinal + Dashboard médico + Assinatura digital** | 22 set – 5 out | 🔄 | ✅ Exames com Sparklines SVG (ExamTimelinePage — 324 linhas). ✅ Score de triagem (ScoreBar, tags risco/tendência/adesão/sintoma). ✅ Dashboard médico com view `triagem` e `resumo`. ⬜ Assinatura digital gov.br (prata mínimo) / ICP-Brasil — não implementado, aguarda definição de provedor. |
| **G.2 — Mind A2/A3 (durante/pós-consulta)** | 6 – 19 out | 🔄 | Editor SOAP com abas. Tags MSE estruturadas. MindLayersTab (orientação clínica, farmacologia, observação). Devolutiva com liberação ao paciente. _(Pendente: score de cobertura SOAP)_ |
| **H — Documentos prévios + IA** | 20 out – 2 nov | ✅ | Upload PDF → `pdf-parse` → extração estruturada (exames, datas, laboratório, médico) → score de confiança por campo → descarte. DoctorDocumentsPage com ConfidenceBar + revisão por campo. AiAlertsPage: 4 categorias (interação, efeito colateral, diretriz, atenção). Log imutável `ai_audit_logs`. Código ALTIA exposto em TermsPage, OnboardingPage, AiAuditPage, BillingPage. |
| **H.2 — Módulo C (Clínica)** | 3 – 16 nov | ✅ | ClinicModule completo: 9 telas (90–98), 5 migrações (027–031), entities (ClinicTerm, BillingRecord, ClinicMetric, NimSyncLog) + AuditLog estendido. 8 páginas frontend: Painel, Equipe, Indicadores, Nim Saúde, Termos versionados, Código institucional, Faturamento, Auditoria. Rotas + Sidebar + i18n 3 idiomas. |
| **I — Integração Nim Saúde** | 17 – 30 nov | ⬜ | Adapter Nim Saúde. 4 fluxos: Agenda, Cadastro, Faturamento, Documentos. _(Aguarda documentação da API)_ |
| **J — Canal de mensagens** | 1 – 14 dez | ✅ | Inbox multi-paciente com filtros (todas/não lidas/risco/arquivadas). Triagem de risco por keywords. Escalação auto/clínica/emergência. Banner de risco para o paciente. |
| **K — Personalização visual** | 15 – 28 dez | ⬜ | Três modos de tema (Clássico, Sério, Fofo). Tokens de design + variáveis CSS. |
| **L — Meditação guiada** | 29 dez – 11 jan | ⬜ | Catálogo curado, técnica 4-4-4, sons ambientais. _(Aguarda pesquisa de licenciamento)_ |
| **M — Piloto na Alternamente** | 12 jan – 8 mar/2027 | ⬜ | Versão usável para 2–3 meses como usuário-zero. Canal estruturado de feedback via GitHub Issues. |

> **Estimativa**: ~36 semanas (jun/2026 → mar/2027) até MVP clínico testado em piloto. Roadmap pós-piloto: wearables reativados, teleconsulta nativa, RNDS/SUS, camadas avançadas Praxis Mind (seção 8.5.4).

---

## 13. Três regras que não podem quebrar (do organograma)

1. **Ciência, não vigilância.** O app comunica tendência, contexto e suporte. Não pune, não assusta, não transforma o paciente em operador do próprio prontuário.
2. **Suporte à decisão, não diagnóstico.** O sistema organiza sinais e reduz ruído para o profissional. Quanto mais ele recomendar conduta automaticamente, maior o risco regulatório e ético.
3. **Privacidade como estrutura.** LGPD não entra no fim como tela de termo. Ela define coleta, acesso, retenção, exportação, auditoria e o que pode ou não ir para IA externa.

---

## 14. O que entra agora, depois e mais tarde

Atualizado: 16 jul 2026. Legenda: ✅ Implementado · 🔄 Parcial · ⬜ Pendente

| Janela | Itens |
|--------|-------|
| **✅ Já implementado** (sprints A, B, C, D parcial, E, F parcial, G parcial, G.2 parcial, H, H.2, J) | ✅ Rename Sentido → Práxis em todo o repositório · ✅ Onboarding 8 passos (blocos A–K) + checkbox LGPD obrigatório · ✅ Cadastro unificado (tela de seleção de tipo + formulários específicos paciente/profissional/clínica) · ✅ Código único `ALT · XXXX` (patient_codes) · ✅ Canal de mensagens com filtros (todas/não lidas/risco/arquivadas), triagem de risco por keywords e escalação (auto/clínica/emergência) · ✅ Banner de risco para o paciente (CVV, SAMU, CVV.org.br) · ✅ Editor SOAP com abas S/O/A/P/MSE/PLANO/MIND + tags MSE estruturadas · ✅ MindLayersTab (orientação clínica, farmacologia, observação estruturada) · ✅ Devolutiva ao paciente com liberação controlada + contexto pré-consulta · ✅ ExportPage PDF via Puppeteer com `?days=N` · ✅ Resumo pré-consulta (tendências, lacunas EXA/ESC/MED, perguntas sugeridas) · ✅ Consulta em andamento (objetivos, confirmação de dados do paciente) · ✅ Migrações 023–025 (institutions, professional_profiles, lifestyle_pillars_snapshots) · ✅ Três regras de enforcement (ClinicalSupportInterceptor, AiConsentGuard, CLAUDE.md) · ✅ Issue templates GitHub (validação clínica, feedback, bug) · ✅ Escalas PHQ-9, GAD-7, ISI, AUDIT, EPDS, U9 (backend + ScalesPage) · ✅ **Check-in rápido completo** — CheckInModal multi-step (humor/ansiedade/sono/medicação/segurança/pilares), calendário mensal colorido, insights automáticos de padrão, toggle de medicação nas configurações, migração 032 · ✅ **Plano de cuidado completo** — MyCarePlanPage (`/meu-plano`) com medicações, hábitos, psicoterapia, exames, encaminhamentos, combinados clínicos; CarePlanTab para médico (edição + templates aplicáveis) · ✅ **Dashboard médico** com score de triagem ScoreBar (risco × tendência × adesão) e view triagem/resumo · ✅ **Exames com mini-gráficos** — ExamTimelinePage com Sparklines SVG e seletor de período · ✅ **Upload PDF + extração** — `pdf-parse`, score de confiança por campo, revisão e confirmação (DoctorDocumentsPage) · ✅ **Open Evidence** — AiAlertsPage com 4 categorias (interação, efeito colateral, diretriz, atenção), log imutável `ai_audit_logs`, ALTIA em toda UI de IA · ✅ **Módulo C completo** — 9 telas (90–98): ClinicModule, entities, 5 migrações (027–031), 8 páginas frontend (Painel, Equipe, Indicadores, Nim Saúde, Termos, Código institucional, Faturamento, Auditoria), rotas e i18n · ✅ Matriz de acesso editável (AccessMatrixPage · tela 92) |
| **🔄 Em andamento / parcial** (sprints B, D, F, G.2) | 🔄 Termos de uso v1 (rascunho pendente com Alternamente) · 🔄 Gatilhos clínicos configuráveis por escala/paciente · 🔄 Visualização longitudinal de respostas de escalas · 🔄 Template PDF gráfico completo (mini-gráficos + lacunas EXA/ESC/CON/MED detalhadas) · 🔄 Score de cobertura SOAP por categoria |
| **⬜ Pendente — MVP** | ⬜ **Assinatura digital gov.br** (prata mínimo) / ICP-Brasil para validade legal de prontuário — aguarda definição de provedor (sprint G) · ⬜ **Termos de uso v1** rascunho final (parceria Alternamente) · ⬜ Score de cobertura SOAP por categoria (sprint G.2) · ⬜ Gatilhos clínicos configuráveis por escala/paciente (sprint D) · ⬜ Visualização longitudinal de respostas de escalas (sprint D) · ⬜ Template PDF gráfico completo com mini-gráficos e lacunas detalhadas (sprint F) |
| **Depois** (sprints I–M, jan/2027+) | Integração Nim Saúde (4 fluxos: Agenda, Cadastro, Faturamento, Documentos) · Personalização visual (3 temas: Clássico, Sério, Fofo) · Meditações guiadas (aguarda pesquisa de licenciamento) · Áudio + transcrição de consulta (Mind A2) · Piloto na Alternamente (2–3 meses como usuário-zero) |
| **Mais tarde** (pós-piloto) | Wearables (reativar HealthKit / Health Connect) · Teleconsulta nativa · Camadas interpretativas avançadas (prosódia, coerência narrativa, neuropsicologia — seção 8.5.4) · Interoperabilidade RNDS/SUS · Internacionalização completa (EN/ES em todos os módulos clínicos) |

---

## 15. Módulo C — Clínica (novo nos mockups)

O módulo de Clínica é um **terceiro perfil de acesso** do Práxis, voltado ao gestor/admin da instituição. Não estava detalhado na v3.0 — foi definido nos mockups de maio/2026 (`Práxis · Clínica · PDF`). 9 telas no tema Sério, divididas em 4 seções.

> **Nav bar da Clínica:** Painel · Equipe · Indicadores · Mais

### 15.1 C.1 — Gestão da clínica (3 telas)

**Painel de gestão (tela 90):**
- Visão agregada: profissionais ativos, pacientes vinculados, alertas de risco alto
- Seção "requer atenção": prontuários sem assinatura há mais de 48h (com nomes dos profissionais), falhas de sincronização Nim Saúde, expiração de CRM de profissional
- Tendências da semana: novos pacientes, consultas, taxa de cancelamento (com delta)
- CTA "Ver relatório"

**Profissionais / equipe (tela 91):**
- Lista com filtros: todos · ativos · férias · expirando · (número por status)
- Cada profissional: avatar, nome, status, especialidade + registro profissional, número de pacientes vinculados

**Matriz de acesso (tela 92):**
- Tabela editável de permissões por perfil: Médico · Psicóloga · Enferm. · Secret. · Financ.
- Permissões: Ver dados clínicos · Editar prontuário · Assinar prontuário · Prescrever · Ver agenda · Editar agenda · Faturamento · Audit. completa
- "Esta é a matriz mínima. Permissões adicionais por profissional individual em Equipe → editar."
- Toda alteração registrada em auditoria

### 15.2 C.2 — Operação (2 telas)

**Indicadores agregados (tela 93):**
- Dados pseudonimizados de qualidade assistencial (nenhum paciente individualmente identificável)
- Filtro de período: 7d / 30d / 90d / 6m / 1 ano
- Métricas: Adesão média (%), Tempo médio de resposta, PHQ-9 médio pacientes ativos, Taxa de cancelamento, Pacientes em risco alto, **NPS · 30 dias** (score 0–100 com delta vs. período anterior)

**Integração Nim Saúde (tela 94):**
- Status da conexão: Conectado · última sincronização há X min
- Credenciais: API key, Endpoint, Ambiente (produção/sandbox), ID da instituição
- 4 fluxos mapeados com status individual:
  - `Agenda → Nim` (sincronizado)
  - `Cadastro pac. ← Nim` (sincronizado)
  - `Faturamento → Nim` (parcial)
  - `Documentos ← Nim` (erro)
- Troca de credenciais disponível no painel

### 15.3 C.3 — Termos e código (2 telas)

**Termo adicional da clínica (tela 95):**
- Rascunho versionado (v0.3 rascunho · v0.2 vigente · arquivados)
- Editor de texto com contagem de palavras
- Histórico de versões com data de publicação e responsável
- Ação: publicar (substitui a versão vigente)
- Apresentado ao paciente **após** o aceite do termo geral do Práxis — soma-se, não substitui

**Código institucional (tela 96):**
- Configuração do prefixo da clínica (3 letras maiúsculas, ex.: `ALT` para Alvorada)
- Regras de geração: formato `PREFIXO · 4 dígitos alfanuméricos`, validade 14 dias, sem reutilização, um código por paciente
- Quem pode gerar: Secret. + Médico + Admin
- Geração de código de teste (não vincula ninguém)

### 15.4 C.4 — Faturamento e auditoria (2 telas)

**Faturamento (tela 97):**
- Visão mensal: total faturado, recebido (%), pendente (n° recibos)
- Lista de recibos recentes com status: pago / pendente / cancelado
- Cada recibo: número, paciente, data, valor

**Auditoria e logs (tela 98):**
- Log completo de ações com busca por usuário ou ação
- Filtros: hoje / 7d / 30d / 90d / tudo; tipo: todos · alertas · acessos · edições · erros
- Registros típicos: "Dra. Ana visualizou prontuário · Marília Costa", "Dr. Carlos recebeu alerta de risco", "falha de sincronização · Nim Saúde", "Admin editou matriz de acesso"

### 15.5 Implicações para o banco de dados

Tabelas adicionais necessárias para o Módulo C:

| Tabela | Função |
|--------|--------|
| `clinic_metrics` | Snapshots periódicos de indicadores agregados (pseudonimizados) |
| `clinic_terms` | Versionamento de termos adicionais por clínica |
| `nim_sync_logs` | Log de sincronizações por fluxo (agenda, cadastro, faturamento, docs) |
| `billing_records` | Recibos e status de pagamento por consulta |
| `audit_logs` | Log imutável de todos os acessos e edições (já existe parcialmente no backend) |

### 15.6 Implicações para o cronograma

O Módulo C é uma sprint adicional entre os sprints G e H do cronograma atual. Ver seção 12 atualizada.

---

## Apêndice A — Referências aos documentos da reunião

- **Ata da reunião** (03/05/2026): `Documento sem título.md` — fonte primária para todas as decisões aqui registradas.
- **Sistema mínimo Alternamente Saúde** (`sistema-minimo-alternamente-saude.pdf`): blueprint completo de cadastro, termo geral, codificação de paciente, matriz de acesso, fluxo IA + revisão humana, estrutura mínima de Drive.
- **Narrativa institucional Alternamente** (`alternamente_narrativa_institucional.pdf`): tom, posicionamento, copy de referência. Útil para alinhar a comunicação do Práxis quando vendido como produto B2B.
- **Resumo Nim Saúde** (`Nim Saude - resumo.docx`): descrição dos módulos do "Praxis Mind" (pré, durante, pós-consulta — médico e paciente). Inspiração direta para o escopo de funcionalidades clínicas.
- **Guia Google Forms pré-consulta** (`guia-google-forms-pre-consulta (1).docx`): versão "low-tech" do formulário de onboarding já em uso na Alternamente. Boa referência para validar campos do onboarding de 8 passos.
- **HTMLs de referência visual** (`_base dos modulos`, `_sentido-dashboard-paciente`, `_sentido-fluxograma-operacional`, `_sentido-organograma-visual`): protótipos anteriores — substituídos pelos mockups abaixo.

### Mockups de design — v1 maio/2026 (fonte das atualizações v3.1)

Localizados em `design/mockups/` (ver [`design/README.md`](../design/README.md)):

| Arquivo | Módulo | Telas | Temas | Status |
|---------|--------|-------|-------|--------|
| `Praxis_Compilacao.pdf` | Paciente Mobile | 53 telas (01–53) | Fofo · Clássico · Sério | ✅ implementado |
| `Praxis_Profissional.pdf` | Profissional Mobile | 36 telas (54–89) | Sério | ✅ implementado |
| `Praxis_Clinica.pdf` | Clínica Mobile | 9 telas (90–98) | Sério | ✅ implementado |

**Total: 98 telas validadas, todas implementadas no MVP (jul/2026).**

**Estrutura de telas por módulo:**

*Módulo A — Paciente (53 telas):* ✅ A.1–A.3 implementadas; A.4–A.x parcial
- A.1 Onboarding e autenticação: telas 01–15 (Splash, Login, Tipo de cadastro, cadastro 1/8–8/8, Vincular profissional, Recuperar senha, Verificar e-mail)
- A.2 Dashboard e diário: telas 16–18 (Home, Calendário do mês, Detalhe de um dia)
- A.3 Check-in rápido: telas 19–24 (Humor, Ansiedade+Energia, Sono, Medicação, Evento, Confirmação)
- *(A.4–A.x: histórico, documentos, escalas, meditação, configurações — parcial)*

*Módulo B — Profissional (36 telas):* ✅ totalmente implementado
- B.1 Onboarding profissional: telas 54–56
- B.2 Dashboard: telas 57–59 (Dashboard do dia, Agenda, Triagem clínica)
- B.3 Perfil longitudinal: telas 60–65 (Painel paciente, Exames, Medicações, Linha do tempo, Evolução, Check-ins)
- B.4 Pré-consulta (Mind A1): telas 66–68 (Resumo longitudinal, Pré-triagem, Lacunas)
- B.5 Durante consulta (Mind A2): telas 69–72 (SOAP live, Score cobertura, MSE, Áudio)
- B.6 Pós-consulta (Mind A3): telas 73–77 (SOAP editor, Plano terapêutico, Assinatura, Confirmação, Devolutiva)
- B.7 Decisão clínica (Open Evidence): telas 78–80 (Suporte, Evidências, Auditoria IA)
- B.8 Documentos: telas 81–82 (Lista, Revisão de extração)
- B.9 Mensagens: telas 83–85 (Caixa, Conversa, Respostas rápidas)
- B.10 Configurações: telas 86–89 (Perfil, Escalas por paciente, Templates de plano, Preferências/tema)

*Módulo C — Clínica (9 telas):* ✅ totalmente implementado (jul/2026)
- C.1 Gestão: telas 90–92 (Painel de gestão, Equipe, Matriz de acesso)
- C.2 Operação: telas 93–94 (Indicadores agregados, Integração Nim Saúde)
- C.3 Termos e código: telas 95–96 (Termo adicional, Código institucional)
- C.4 Faturamento e auditoria: telas 97–98 (Faturamento, Auditoria e logs)

---

*Documento gerado em maio/2026 a partir da compilação da reunião de 03/05/2026 com Alternamente Saúde e dos materiais institucionais associados. Atualizado em junho/2026 (v3.1) com 98 mockups validados; atualizado em julho/2026 (v3.2) com Módulo C completo e status de implementação revisado. Próxima revisão: após retorno do colega com escalas + documentação da API Nim Saúde + escopo de IA.*
