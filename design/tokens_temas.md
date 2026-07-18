# Tokens de Design — 3 Temas do Práxis

Base para todos os mockups e (futuramente) variáveis CSS no `web/src/`.

---

## Tipografia (compartilhada por todos os temas)

> **Decisão:** os 3 temas usam **a mesma família tipográfica**, herdada do Clássico. Diferenciação fica por cor, ornamento e capitalização.

- Títulos e KPIs numéricos: **Cormorant Garamond**, peso 500
- Labels, dados, navegação, corpo: **Inter**, pesos 400 / 500 / 600
- Tamanhos padrão: 11 (label) / 13 (body) / 14 (body forte) / 18 (subtítulo) / 22 (título card) / 28–32 (greeting)

---

## Tema **Fofo** (default — herança do Sentido)

Inspiração: Studio Ghibli, aquarela japonesa, "papel washi".

### Paleta
| Token | Hex | Uso |
|-------|-----|-----|
| `--bambu` | `#7FA265` | Verde principal, acentos primários |
| `--folha-nova` | `#A8C58A` | Verde claro, hover/secundário |
| `--neblina` | `#B8A1B0` | Lavanda suave, dados sensíveis |
| `--terracota` | `#C97956` | Aviso/atenção sem alarme |
| `--anoitecer` | `#7B6388` | Roxo profundo (humor "horrível") |
| `--lanterna` | `#D8C170` | Amarelo lanterna (destaques warm) |
| `--washi` | `#F4EDDA` | Bege papel, fundo principal |
| `--cedro` | `#3A4A3A` | Verde escuro, tipografia primária |
| `--ceu-claro` | `#DFE9EE` | Azul nuvem, gradiente do header |
| `--ceu-medio` | `#BACADB` | Azul nuvem mais saturado |

### Tipografia
- Mesma do Clássico (Cormorant Garamond + Inter, ver topo).
- Sem itálicos forçados — a leveza vem do espaçamento e dos ornamentos, não da fonte.

### Ornamentos
- Espíritos do humor (5 personagens — radical/bem/mais ou menos/mal/horrível)
- Plantinhas decorativas em cantos
- Nuvens suaves no header
- Cards com sombra muito suave + borda arredondada (18px)
- Linhas finas em terracota como divisores

### Voz
- Frases curtas e contemplativas, em **minúsculo**: "olá, marília", "mais um dia, mais uma história", "um pequeno bosque de dias"

---

## Tema **Clássico**

Inspiração: documento médico bem feito + papel washi quente. Paleta sage/cedro herdada do Fofo, mas com estrutura sóbria (cards retos, bordas finas, sem ornamentos).

### Paleta (verde sage — irmã do Fofo)
| Token | Hex | Uso |
|-------|-----|-----|
| `--primary` | `#7FA265` | Bambu — primário (mesmo do Fofo) |
| `--primary-dark` | `#3A4A3A` | Cedro — texto principal e bordas escuras |
| `--accent` | `#B8956A` | Bege ouro, destaques warm |
| `--neblina` | `#B8A1B0` | Lavanda — séries secundárias em gráfico |
| `--bg` | `#FAF6E8` | Bege claro (entre washi e off-white) |
| `--surface` | `#FFFFFF` | Cards |
| `--border` | `#E0D9C5` | Bordas sutis warm |
| `--text-primary` | `#3A4A3A` | Cedro — texto principal |
| `--text-secondary` | `#7B8478` | Sage gray — texto auxiliar |
| `--success` | `#7FA265` | Bambu (OK) |
| `--warn` | `#C97956` | Terracota (mesmo do Fofo) |
| `--danger` | `#A0524D` | Vermelho terra |

### Tipografia
- Padrão de referência (ver topo). Cormorant Garamond para títulos, Inter para o resto.

### Ornamentos
- Sem ilustrações decorativas
- Linha fina (1px) como divisor
- Cards com borda 1px + sombra muito sutil
- Border radius: 8px
- Ícones lineares (Lucide), 1.5px stroke

### Voz
- Frases sóbrias, em sentence case: "Olá, Marília", "Próxima consulta", "Resultados de exames"

---

## Tema **Sério**

Inspiração: dashboard clínico, dados em primeiro lugar.

> **Nota de marca:** o Sério é "estruturalmente clínico" mas **mantém a paleta sage** (bambu/terracota/neblina) do Fofo e do Clássico. Cores tech genéricas (azul `#0070F3`, verde sucesso `#10B981`, âmbar `#F59E0B`) **não são usadas** — Práxis é um produto sage independentemente da apresentação. O contraste é construído com **densidade, tipografia e densidade de informação**, não com cores estranhas à marca.

### Paleta
| Token | Hex | Uso |
|-------|-----|-----|
| `--primary` | `#1A1A1A` | Quase preto, primário |
| `--accent` | `#0070F3` | Azul de interação |
| `--bg` | `#FFFFFF` | Branco puro |
| `--surface` | `#F8F9FA` | Cinza muito claro, cards |
| `--border` | `#E5E7EB` | Bordas |
| `--text-primary` | `#0A0A0A` | Texto principal |
| `--text-secondary` | `#525252` | Texto auxiliar |
| `--text-muted` | `#A3A3A3` | Texto terciário |
| `--success` | `#7FA265` | Bambu (sage) — OK |
| `--warn` | `#C97956` | Terracota (sage) — Aviso |
| `--danger` | `#A0524D` | Vermelho terra |
| `--data-1` | `#7FA265` | Bambu — série 1 em gráficos (mesmo do Fofo/Clássico) |
| `--data-2` | `#B8A1B0` | Neblina — série 2 (lavanda discreta para distinguir) |
| `--data-3` | `#D8C170` | Lanterna — série 3 |
| `--trend-up` | `#7FA265` | Bambu para ▲ tendências positivas |
| `--trend-down` | `#C97956` | Terracota para ▼ tendências negativas |

### Tipografia
- Mesma do Clássico (Cormorant Garamond + Inter).
- Numerais tabulares (`font-feature-settings: "tnum"`) nos KPIs e horários.

### Ornamentos
- Zero decoração
- Cards: borda 1px, sem sombra
- Border radius: 6px
- Ícones lineares (Lucide), 1.5px stroke
- Densidade um pouco mais alta — paddings menores que os outros temas
- Gráficos sempre visíveis (preferência por sparklines inline)

### Voz
- Direto e técnico: "Olá, Marília", "Próxima consulta · 20/09 10:30", "HbA1c 7,8%"

---

## Mapa de equivalência

| Conceito | Fofo | Clássico | Sério |
|----------|------|----------|-------|
| Cor primária | `#7FA265` bambu | `#7FA265` bambu (mesmo) | `#1A1A1A` quase preto |
| Texto primário | `#3A4A3A` cedro | `#3A4A3A` cedro (mesmo) | `#0A0A0A` |
| Cor de fundo | `#F4EDDA` washi | `#FAF6E8` washi-light | `#FFFFFF` branco |
| Cor de card | `#FFFFFF` | `#FFFFFF` | `#F8F9FA` |
| Bordas | nenhuma (só sombra) | `#E0D9C5` 1px | `#E5E7EB` 1px |
| Tipografia título | Cormorant Garamond 500 | Cormorant Garamond 500 | Cormorant Garamond 500 |
| Tipografia corpo | Inter | Inter | Inter |
| Border radius | 18px | 8px | 6px |
| Densidade | Baixa (muito ar) | Média | Alta |
| Decoração | Espíritos + plantas + nuvens + colinas | Galho de oliveira + folhas + washes aquarela | Nenhuma |
| Capitalização | minúsculo poético | sentence case | sentence case |

---

*A tela de referência (Paciente Mobile Home) implementa esses tokens em SVG estático para validação visual.*
