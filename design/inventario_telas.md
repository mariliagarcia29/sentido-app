# Inventário de Telas — Práxis

**Versão:** 1.0
**Data:** Maio 2026
**Documentos relacionados:** `plano_modificacoes_praxis.md`, `plano_app.md`

---

## Convenções

- **Plataformas:** `M` = mobile (~375×812), `W` = web/desktop (~1440×900)
- **Perfis:** `P` = Paciente, `Pr` = Profissional, `Cl` = Clínica/Instituição
- **Status no MVP:** ✅ entra | 🔧 entra com escopo reduzido | 🔮 pós-MVP
- **Temas:** todas as telas existem nos 3 (Fofo / Clássico / Sério). O Fofo é o default.

Total estimado: **~75 telas únicas** (sem contar variações por tema). Multiplicado pelos 3 temas = ~225 mockups completos. Para o MVP, priorizar as marcadas com ✅.

---

## A. PACIENTE

### A.1 Onboarding e autenticação `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 1 | Splash / abertura | ✅ | Logo Práxis + frase âncora ("mais um dia, mais uma história" — Fofo) |
| 2 | Login (e-mail + senha + Google/Apple) | ✅ | Autenticação |
| 3 | Cadastro — seleção de tipo | ✅ | Tela única: Paciente / Profissional / Clínica |
| 4 | Cadastro paciente — Bloco A (identificação) | ✅ | Nome, nome social, data nasc., CPF, e-mail, telefone, endereço |
| 5 | Cadastro paciente — Bloco C (preferências de contato) | ✅ | Canal preferencial, restrições de privacidade |
| 6 | Cadastro paciente — Bloco D (motivo da consulta) | ✅ | Queixa principal, expectativas |
| 7 | Cadastro paciente — Bloco E (histórico) | ✅ | Diagnósticos prévios, internações, **histórico de risco (obrigatório)** |
| 8 | Cadastro paciente — Bloco F (medicações + alergias) | ✅ | Em uso, dose, alergias, reações |
| 9 | Cadastro paciente — Bloco H (documentos prévios) | ✅ | Upload opcional de PDFs |
| 10 | Termo geral (Bloco I) — modal scrollável | ✅ | Texto integral antes do aceite |
| 11 | Checkboxes opcionais (Bloco J) | ✅ | 4 checkboxes nunca pré-marcados |
| 12 | Confirmação final (Bloco K) | ✅ | Declaração de veracidade + aceite |
| 13 | Vincular profissional/instituição | ✅ | Via código/link inicial fornecido pelo profissional |
| 14 | Recuperação de senha | ✅ | Fluxo padrão por e-mail |
| 15 | Esqueci minha senha — confirmação | ✅ | Tela de "verifique seu e-mail" |

### A.2 Dashboard e diário `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 16 | **Home** ("Olá, [nome]") | ✅ | Visão do dia: próxima consulta, espírito do dia, atalho de check-in, últimos registros, plano da semana |
| 17 | Calendário do mês ("bosque de dias") | ✅ | Grid mensal com cor por humor de cada dia |
| 18 | Detalhe de um dia | ✅ | Check-ins, escalas, eventos daquele dia |

### A.3 Check-in rápido (30–60s) `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 19 | Check-in tela 1 — humor | ✅ | 5 espíritos (Fofo) ou 0–10 (Clássico/Sério) |
| 20 | Check-in tela 2 — ansiedade + energia | ✅ | Sliders ou cards 0–10 |
| 21 | Check-in tela 3 — sono | ✅ | Qualidade 0–10 + horas |
| 22 | Check-in tela 4 — medicação (toggleable) | ✅ | Sim/Não/Pulado (esconder se desligado) |
| 23 | Check-in tela 5 — evento (opcional) | ✅ | Texto curto livre |
| 24 | Confirmação do check-in | ✅ | Mensagem positiva + streak |

### A.4 Plano de cuidado `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 25 | "Meu plano da semana" | ✅ | Lista de tarefas com check + frequência sugerida |
| 26 | Detalhe de tarefa | ✅ | Descrição, periodicidade, último check |
| 27 | Combinados clínicos | ✅ | Lista de combinados com a equipe ("se ansiedade>8 por 3d, avise") |
| 28 | Histórico de cumprimento | 🔧 | Calendário de adesão por tarefa |

### A.5 Escalas validadas `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 29 | Lista de escalas pendentes | ✅ | PHQ-9, GAD-7, U9, etc. com prazo |
| 30 | Aplicação de escala (paginada) | ✅ | Uma pergunta por tela, barra de progresso |
| 31 | Resultado + tendência | ✅ | Score, banda de severidade, gráfico longitudinal |

### A.6 Documentos prévios e exames `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 32 | Lista de documentos enviados | ✅ | Cards por tipo, data, status (em revisão / extraído / arquivado) |
| 33 | Upload de novo documento | ✅ | Câmera (mobile) ou file picker (web) + tipo |
| 34 | Timeline de exames extraídos | ✅ | Gráfico longitudinal por marcador (TSH, glicemia, hemograma) |
| 35 | Detalhe de marcador | ✅ | Histórico completo + valores de referência |

### A.7 Mensagens seguras `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 36 | Lista de conversas | ✅ | Conversas com profissional/equipe, com badge de não-lida |
| 37 | Conversa | ✅ | Thread com profissional, sinalização de risco, anexos |
| 38 | Composição de mensagem | ✅ | Editor com aviso "isto não é canal de emergência" |
| 39 | Triagem de risco — alerta | ✅ | Modal de escalonamento se risco detectado |

### A.8 Pré-consulta `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 40 | Resumo do período (versão paciente) | ✅ | Versão simplificada da síntese: tendências + plano vigente |

### A.9 Bem-estar / Meditação `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 41 | Catálogo de meditações | ✅ | Cards por categoria (444, antes de dormir, crise, apoio a quem cuida) |
| 42 | Player de meditação | ✅ | Áudio + voz guiada + tempo restante + sons ambientais opt-in |
| 43 | Sons ambientais | 🔧 | Mixer simples (chuva, mar, floresta) — opt-in |

### A.10 Configurações e LGPD `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 44 | Perfil do usuário | ✅ | Foto, nome, dados básicos, botão de editar |
| 45 | Preferências | ✅ | **Tema (Clássico/Sério/Fofo)**, idioma, notificações, toggle de medicação |
| 46 | Painel LGPD | ✅ | Meus consentimentos (com toggle revogar) |
| 47 | Quem acessou meus dados | ✅ | Lista do `audit_logs` |
| 48 | Solicitar exportação | ✅ | Botão + e-mail de notificação quando pronto |
| 49 | Solicitar exclusão | ✅ | Soft delete com prazo de 15 dias para reverter |
| 50 | Termos e políticas | ✅ | Versão atual + histórico |
| 51 | Sobre o app | 🔧 | Versão, contato, créditos |

### A.11 Exportação `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 52 | Exportar relatório | ✅ | Seleção de período + módulos a incluir |
| 53 | Lista de exportações | ✅ | Histórico com link de download (URL S3 expira em 24h) |

---

## B. PROFISSIONAL

> Profissional: médico, psicólogo, nutricionista, enfermeiro, educador físico. As telas são as mesmas; o que muda é a especialidade e os campos disponíveis.

### B.1 Onboarding profissional `M+W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 54 | Cadastro profissional — dados básicos | ✅ | Nome, e-mail, profissão (dropdown), CRM/CRP/CRN/CREF/COREN, UF |
| 55 | Cadastro profissional — vínculo institucional | ✅ | Opcional: vincular a clínica via código |
| 56 | Configurar perfil | ✅ | Foto, especialidade, biografia curta |

### B.2 Dashboard profissional `W` (`M` reduzido)

| # | Tela | Status | Função |
|---|------|--------|--------|
| 57 | **Dashboard do dia** | ✅ | Pacientes que precisam de atenção + agenda do dia + alertas + check-ins pendentes |
| 58 | Agenda clínica | ✅ | Grade do dia/semana lendo Nim Saúde |
| 59 | Triagem | ✅ | Fila priorizada por critério clínico (não por volume) |

### B.3 Perfil longitudinal do paciente `W` (`M` reduzido)

| # | Tela | Status | Função |
|---|------|--------|--------|
| 60 | **Painel do paciente** | ✅ | Visão geral: dados básicos, problemas ativos, medicações, contatos |
| 61 | Detalhes do paciente — exames | ✅ | Resultados de exames com mini-gráficos longitudinais |
| 62 | Detalhes do paciente — medicações | ✅ | Em uso, histórico, motivo de suspensão |
| 63 | Linha do tempo clínica | ✅ | Eventos consolidados (consultas, exames, escalas, plano, medicações) |
| 64 | Evolução clínica (gráficos) | ✅ | Múltiplos eixos: humor, sono, ansiedade, escalas |
| 65 | Histórico de check-ins | ✅ | Calendário com dados completos |

### B.4 Pré-consulta (Praxis Mind A1) `W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 66 | **Resumo longitudinal pré-consulta** | ✅ | Síntese gerada automaticamente: 14/30/60 dias, tendências, lacunas, perguntas sugeridas |
| 67 | Pré-triagem do paciente | ✅ | Formulários e escalas que o paciente preencheu antes da consulta |
| 68 | Lacunas e perguntas sugeridas | ✅ | Pontos a abordar na consulta |

### B.5 Durante consulta (Praxis Mind A2) `W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 69 | Editor de notas em tempo real | 🔧 | Tela de tomada de notas durante a consulta |
| 70 | Score de cobertura clínica | 🔮 | 0–100% por categoria, sugestões de perguntas (pós-MVP) |
| 71 | Tags comportamentais | 🔮 | Registro padronizado: choro, inquietação, afeto, discurso (pós-MVP) |
| 72 | Captura de áudio + transcrição | 🔮 | Pós-MVP — exige consentimento específico |

### B.6 Pós-consulta (Praxis Mind A3) `W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 73 | Editor de nota clínica | ✅ | Formato: SOAP, anamnese estruturada, MSE, hipóteses, conduta |
| 74 | Plano terapêutico estruturado | ✅ | Medicamentos, psicoterapia, hábitos, exames, encaminhamentos, follow-ups |
| 75 | **Assinatura digital (gov.br + CRM)** | ✅ | Fluxo completo da seção 11A: validação CRM → escolha de método → autenticação → assinatura |
| 76 | Confirmação de assinatura | ✅ | Tela de sucesso + status do prontuário (oficial/válido) |
| 77 | Devolutiva ao paciente | ✅ | Editor de versão simples, revisada, liberada após assinatura |

### B.7 Decisão clínica (Open Evidence) `W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 78 | Suporte à decisão | ✅ | Alertas Camada 3: interações medicamentosas, efeitos colaterais conhecidos |
| 79 | Evidências citadas | ✅ | Cards com citações de literatura científica retornadas pelo Open Evidence |
| 80 | Auditoria de invocação IA | ✅ | Histórico de chamadas + status de revisão humana |

### B.8 Documentos do paciente `W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 81 | Documentos extraídos do paciente | ✅ | Lista + status (extraído/revisado) |
| 82 | Revisão de extração | ✅ | Editor para corrigir campos extraídos por parser/IA |

### B.9 Mensagens (multi-paciente) `W` (`M` lista)

| # | Tela | Status | Função |
|---|------|--------|--------|
| 83 | Caixa de mensagens | ✅ | Lista priorizada por risco e data |
| 84 | Conversa com paciente | ✅ | Thread + sinalização de triagem + acesso ao perfil |
| 85 | Respostas rápidas | ✅ | Templates configuráveis |

### B.10 Configurações profissional `W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 86 | Perfil profissional | ✅ | Dados, registro, vínculo institucional |
| 87 | Configuração de escalas por paciente | ✅ | Quais escalas aplicar, periodicidade, gatilhos |
| 88 | Configuração de plano de cuidado padrão | 🔧 | Templates de plano por condição |
| 89 | Preferências e tema | ✅ | Tema, notificações |

---

## C. CLÍNICA / INSTITUIÇÃO `W`

| # | Tela | Status | Função |
|---|------|--------|--------|
| 90 | Painel de gestão | ✅ | Visão consolidada: profissionais ativos, pacientes vinculados, indicadores básicos |
| 91 | Cadastro/edição de profissionais | ✅ | Adicionar profissional, definir papel |
| 92 | Configuração de matriz de acesso | ✅ | Matriz mínima (médico/psicóloga/enfermeira/secretária/financeiro) |
| 93 | Indicadores agregados | ✅ | Dados pseudonimizados — qualidade assistencial |
| 94 | Integração Nim Saúde | ✅ | Configuração de credenciais e mapeamento |
| 95 | Termos adicionais da clínica | ✅ | Termo próprio que se soma ao termo geral do Práxis |
| 96 | Configuração do código institucional | ✅ | Definir prefixo (ex.: "ALT") e regras de geração |
| 97 | Faturamento (mínimo) | 🔧 | Recibos e relatórios financeiros básicos |
| 98 | Auditoria e logs | ✅ | Quem acessou o quê, quando |

---

## D. TELAS COMPARTILHADAS / SISTEMA

| # | Tela | Status | Função |
|---|------|--------|--------|
| 99 | Erro 404 | ✅ | Tela de "página não encontrada" no tom do tema |
| 100 | Erro 500 / fora do ar | ✅ | Tela de erro do servidor |
| 101 | Sem conexão (offline) | 🔧 | Aviso + botão de tentar novamente |
| 102 | Manutenção programada | 🔧 | Banner ou tela cheia |
| 103 | Versão desatualizada | 🔧 | Forçar update de mobile |

---

## E. NÍVEIS DE PRIORIDADE PARA O MVP

### Lote 1 — essenciais para piloto
Telas 1–24, 25, 29–31, 32–34, 36–37, 40, 44–47, 50, 54–58, 60–61, 63–64, 66–68, 73–77, 90–92, 96.
**Total ≈ 50 telas únicas.**

### Lote 2 — completam a experiência
Telas 26–28, 38–39, 41–43, 48–49, 51–53, 59, 62, 65, 78–82, 86–89, 93–95.
**Total ≈ 30 telas únicas.**

### Lote 3 — pós-piloto
Telas 69–72, 83–85, 97–103 + futuras camadas avançadas do Praxis Mind (8.5.4 do plano de modificações).

---

## F. MAPA DE NAVEGAÇÃO (alto nível)

### Paciente Mobile — bottom nav
`Diário (home)` · `Jardim (plano + bem-estar)` · `Calendário` · `Mais (mensagens, exames, escalas, config)`

### Paciente Web — sidebar
`Início` · `Registros` · `Plano` · `Exames` · `Mensagens` · `Bem-estar` · `Configurações`

### Profissional Web — sidebar
`Hoje` · `Agenda` · `Pacientes` · `Mensagens` · `Decisão clínica` · `Configurações`

### Profissional Mobile — bottom nav
`Hoje` · `Pacientes` · `Mensagens` · `Mais`

### Clínica Web — sidebar
`Painel` · `Profissionais` · `Pacientes` · `Indicadores` · `Auditoria` · `Configurações`

---

*Próximo passo: validar este inventário; em seguida produzir a tela de referência (Home Paciente Mobile) nos 3 temas como prova de conceito antes de escalar para todas as 50 telas do Lote 1.*
