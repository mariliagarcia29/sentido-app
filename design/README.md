# Design — Práxis

Documentação dos assets de design do Práxis. Todos os mockups são mobile (~375×812) produzidos em Figma/Canva e exportados em maio/2026.

---

## Estrutura de diretórios

```
design/
├── README.md                   — este arquivo
├── estrutura_telas.md          — esqueleto compartilhado das telas (blocos Y, alturas, conteúdo)
├── inventario_telas.md         — lista completa das ~75 telas únicas com status MVP
├── tokens_temas.md             — tokens de cor, tipografia, border-radius por tema (Fofo/Clássico/Sério)
└── mockups/
    ├── Praxis_Compilacao.pdf   — Módulo A: Paciente, 53 telas, 3 temas por página
    ├── Praxis_Profissional.pdf — Módulo B: Profissional, 36 telas, tema Sério
    ├── Praxis_Clinica.pdf      — Módulo C: Clínica, 9 telas, tema Sério
    ├── Praxis - telas mobile.pdf — compilação alternativa (exportação anterior)
    ├── Práxis · Compilação · 3 temas por página_files/  — assets da compilação (HTML export)
    ├── Práxis · Profissional · PDF_files/                — assets do PDF profissional
    ├── Práxis · Clínica · PDF_files/                     — assets do PDF clínica
    └── *.svg                   — SVGs individuais por tela × tema (convenção: módulo_tela_tema.svg)
```

---

## Módulos e telas

### Módulo A — Paciente (53 telas · Fofo · Clássico · Sério)

| Seção | Telas | Status |
|-------|-------|--------|
| A.1 Onboarding e autenticação | 01–15 | ✅ implementado |
| A.2 Dashboard e diário | 16–18 | ✅ implementado |
| A.3 Check-in rápido | 19–24 | ✅ implementado |
| A.4–A.x Histórico, documentos, escalas, configurações | 25–53 | 🔧 parcial |

### Módulo B — Profissional (36 telas · tema Sério)

| Seção | Telas | Status |
|-------|-------|--------|
| B.1 Onboarding profissional | 54–56 | ✅ implementado |
| B.2 Dashboard e agenda | 57–59 | ✅ implementado |
| B.3 Perfil longitudinal | 60–65 | ✅ implementado |
| B.4 Pré-consulta (Mind A1) | 66–68 | ✅ implementado |
| B.5 Durante consulta (Mind A2) | 69–72 | ✅ implementado |
| B.6 Pós-consulta (Mind A3) | 73–77 | ✅ implementado |
| B.7 Decisão clínica (Open Evidence) | 78–80 | ✅ implementado |
| B.8 Documentos | 81–82 | ✅ implementado |
| B.9 Mensagens | 83–85 | ✅ implementado |
| B.10 Configurações | 86–89 | ✅ implementado |

### Módulo C — Clínica (9 telas · tema Sério)

| Seção | Telas | Status |
|-------|-------|--------|
| C.1 Gestão (Painel, Equipe, Matriz de acesso) | 90–92 | ✅ implementado |
| C.2 Operação (Indicadores, Nim Saúde) | 93–94 | ✅ implementado |
| C.3 Termos e código (Termos versionados, Código institucional) | 95–96 | ✅ implementado |
| C.4 Faturamento e auditoria | 97–98 | ✅ implementado |

**Total: 98 telas validadas, todas implementadas no MVP.**

---

## Temas

| Tema | Perfil | Cor de fundo | Primária | Border radius |
|------|--------|-------------|----------|--------------|
| Fofo | Paciente (default) | `#F4EDDA` washi | `#7FA265` bambu | 18px |
| Clássico | Paciente (alternativo) | `#FAF6E8` washi-light | `#7FA265` bambu | 8px |
| Sério | Profissional + Clínica | `#FFFFFF` branco | `#0A0A0A` | 6px |

Tokens completos em [`tokens_temas.md`](tokens_temas.md). Estrutura de blocos compartilhados em [`estrutura_telas.md`](estrutura_telas.md).

---

## Convenção de nomes dos SVGs

```
{módulo}_{tela}_{tema}.svg
```

Exemplos:
- `paciente_mobile_checkin_humor_fofo.svg` — tela 19, tema Fofo
- `paciente_mobile_calendario_classico.svg` — tela 17, tema Clássico
- `profissional_mobile_soap_serio.svg` — tela 73, tema Sério

---

## Referências da reunião de 03/05/2026

Documentos que originaram as decisões de produto registradas em `plano_modificacoes_praxis.md`:

| Documento | Conteúdo |
|-----------|----------|
| `Ata da reunião (Alternamente Saúde)` | Fonte primária de todas as decisões do plano |
| `sistema-minimo-alternamente-saude.pdf` | Blueprint de cadastro, termos, codificação de paciente, matriz de acesso, fluxo IA |
| `alternamente_narrativa_institucional.pdf` | Tom, posicionamento e copy de referência para B2B |
| `Nim Saude - resumo.docx` | Módulos Praxis Mind (pré/durante/pós-consulta) — inspiração para escopo clínico |
| `guia-google-forms-pre-consulta.docx` | Versão low-tech do onboarding em uso na Alternamente — referência para validação dos campos |

*Estes documentos não estão versionados aqui — mantidos em armazenamento externo seguro.*
