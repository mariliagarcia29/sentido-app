# Estrutura compartilhada das telas

**Princípio:** uma tela do Práxis tem o **mesmo esqueleto, o mesmo conteúdo e a mesma ordem de blocos** nos 3 temas. Só muda a *superfície* (cor, tipografia, raio, ornamento).

Isso garante que Fofo, Clássico e Sério sejam reconhecíveis como o **mesmo aplicativo**.

---

## Esqueleto da Home Paciente Mobile (referência)

| Y | Bloco | Altura | Conteúdo idêntico nas 3 versões |
|---|-------|--------|--------------------------------|
| 50–80 | Status bar | 30 | `13:29` · `5G ▮▮▮▯` |
| 90–160 | Greeting | 70 | Título: `Olá, Marília` <br> Subtítulo: `Sábado, 25 de abril` |
| 180–270 | Próxima consulta | 90 | Label: `PRÓXIMA CONSULTA` <br> Main: `20 set · 10:30` <br> Sub: `Dr. Ricardo Borges · Cardiologia` <br> CTA: `Detalhes →` |
| 290–370 | Check-in | 80 | Label: `CHECK-IN DE HOJE` <br> Main: `Como você está hoje?` <br> Sub: `30 segundos · 4 perguntas` <br> Botão: `Registrar` |
| 390–560 | Indicadores | 170 | Label: `ÚLTIMOS 30 DIAS` <br> 3 KPIs lado a lado: `HUMOR 7,2 ▲0,4` · `SONO 6,4h ▼0,2` · `ADESÃO 94% ▲6%` <br> Mini gráfico de linhas (humor + sono) |
| 580–740 | Plano de hoje | 160 | Label: `MEU PLANO DE HOJE · 1/3` <br> ✓ `Metformina 850mg` · `08:14` <br> ☐ `Caminhada 30 min` · `pendente` <br> ☐ `Respiração 444 antes de dormir` |
| 800–880 | Bottom nav | 80 | `Início` (ativo) · `Plano` · `Calendário` · `Mais` |

**Margens horizontais:** cards de `x=40` a `x=390` (largura 350px). Cantos do telefone em `x=20` e `x=410`.

---

## O que pode mudar entre os temas

| Atributo | Fofo | Clássico | Sério |
|----------|------|----------|-------|
| Cor de fundo | `#F4EDDA` washi | `#FAF6E8` washi-light | `#FFFFFF` branco puro |
| Cor de card | branco sobre washi | branco com borda 1px `#E0D9C5` | cinza muito claro `#F8F9FA` |
| Cor primária | `#7FA265` bambu | `#7FA265` bambu (mesmo) | `#0A0A0A` quase preto |
| Texto principal | `#3A4A3A` cedro | `#3A4A3A` cedro (mesmo) | `#0A0A0A` |
| Tipografia título | Cormorant Garamond 500 | Cormorant Garamond 500 | Cormorant Garamond 500 |
| Tipografia corpo | Inter | Inter | Inter |
| Border radius cards | 18px | 8px | 6px |
| Sombras | suave (drop-shadow filter) | mínima | nenhuma |
| Ornamentos extras | nuvens + plantinhas + colinas | galho de oliveira (canto sup. dir.) + folhas (rodapé) + washes aquarela | nenhum |
| Capitalização títulos | `olá, marília` (lowercase) | `Olá, Marília` | `Olá, Marília` |
| Voz das labels | `próxima consulta` (lower) | `PRÓXIMA CONSULTA` | `PRÓXIMA CONSULTA` |

---

## O que NÃO muda

- Posição de cada card (Y/altura)
- Largura dos cards (350px)
- Ordem dos blocos
- Conteúdo informacional (texto exato, números exatos)
- Bottom nav (mesmos 4 ícones, mesma ordem)
- Estrutura interna de cada card (label em cima, main no meio, sub embaixo, CTA à direita)

---

*Toda nova tela deve seguir essa disciplina: definir o esqueleto compartilhado primeiro, depois aplicar os 3 temas como variações de superfície sobre o mesmo esqueleto.*

---

## Esqueleto da tela Calendário do Mês ("bosque de dias")

Tela #17 do inventário. Visualização do mês corrente com cor por humor de cada dia.

| Y | Bloco | Altura | Conteúdo idêntico nas 3 versões |
|---|-------|--------|--------------------------------|
| 50–80 | Status bar | 30 | `13:29` · `5G ▮▮▮▯` |
| 90–145 | Header | 55 | Setas `‹` `›` + título centralizado: `abril · 2026` (Fofo) ou `Abril · 2026` (Clássico/Sério) |
| 165–195 | Weekday row | 30 | `D S T Q Q S S` |
| 200–430 | Grid (5 semanas × 7 dias) | 230 | Cada cel com data + círculo colorido por humor; dia 25 = hoje (anel); dia 27 = consulta marcada (anel pontilhado) |
| 450–630 | Card "Contagem do mês" | 180 | Label + donut central `16 dias` + legenda com 4 cores: <br> `radical · 6 dias` (bambu) <br> `bem · 6 dias` (folha-nova) <br> `mais ou menos · 3 dias` (lanterna) <br> `mal · 1 dia` (terracota) |
| 650–740 | Card "Insights" | 90 | Label + 1–2 frases curtas resumindo o mês |
| 800–880 | Bottom nav | 80 | `Início · Plano · Calendário (ativo) · Mais` |

### Distribuição de humor em abril 2026 (idêntica nas 3 versões)

Hoje = **25 de abril** (sábado). Próxima consulta = **27 de abril** (segunda).

| Dia | Humor | Cor |
|-----|-------|-----|
| 1, 3, 8, 15, 18, 21, 22, 23 | não registrado | washi/cinza muito claro |
| 4, 5, 14, 19, 24 | radical | `#7FA265` bambu |
| 2, 6, 7, 13, 16, 20 | bem | `#A8C58A` folha-nova |
| 9, 12, 17 | mais ou menos | `#D8C170` lanterna |
| 11 | mal | `#C97956` terracota |
| 10 | não registrado | washi |
| 25 | bem (hoje, anel) | `#A8C58A` + ring |
| 26, 28, 29, 30 | futuro | washi muito claro |
| 27 | consulta marcada | anel pontilhado terracota |

### Geometria da grade

- Início do grid: `x=30`, `y=200`
- Largura útil: 370 → 7 colunas de **53px**
- Altura por linha: **46px** → 5 linhas = 230px
- Círculo de humor: raio **14**, centro da célula
- Número do dia: tamanho **13**, fonte: serif (Fofo/Clássico) ou sans (Sério); centralizado dentro do círculo
- Dias de fora do mês (29-31 mar; 1-2 mai): opacidade 0.3

---

## Esqueleto da tela Detalhe de um Dia

Tela #18 do inventário. Visualização completa de tudo que aconteceu em um dia específico (acessada ao clicar num dia do calendário ou da timeline).

**Dia de exemplo: terça-feira, 14 de abril de 2026** — humor radical (bambu).

| Y | Bloco | Altura | Conteúdo idêntico nas 3 versões |
|---|-------|--------|--------------------------------|
| 50–80 | Status bar | 30 | `13:29` · `5G ▮▮▮▯` |
| 90–145 | Header | 55 | Back `‹` + título centralizado: `terça, 14 de abril` (Fofo) ou `Terça, 14 de abril` (Clássico) ou `14/04 · Terça` (Sério) + ícone `…` à direita |
| 165–285 | Hero "Espírito do dia" | 120 | Espírito/círculo central (Fofo: personagem completo; Clássico/Sério: círculo grande) + label `Radical` + sub-label `seu melhor humor da semana` |
| 305–435 | Card "Como me senti" | 130 | Label + 4 métricas: <br> `Humor 10/10` <br> `Ansiedade 2/10` <br> `Energia 9/10` <br> `Sono 8h · qualidade 9/10` |
| 455–555 | Card "Medicação" | 100 | Label + 2 itens: <br> ✓ `Metformina 850 mg · 08:14` <br> ✓ `Vitamina D · 12:30` |
| 575–705 | Card "O que aconteceu" | 130 | Label + 3 itens: <br> ✓ `Caminhada 30 min · 17:00` <br> ✓ `Respiração 444 · 22:00` <br> ★ `Almoço com a família · 13:00` |
| 725–795 | Card "Nota do diário" | 70 | Label + texto livre: `"Dia leve, com vento. Caminhei pelo parque com Marina. Me senti em casa."` |
| 800–880 | Bottom nav | 80 | `Início · Plano · Calendário (ativo) · Mais` |

### Cores e estados

- Espírito do dia segue a paleta de humor (radical=bambu, bem=folha-nova, mais ou menos=lanterna, mal=terracota, horrível=anoitecer)
- Tarefas concluídas (✓) em bambu
- Eventos importantes (★) em terracota como destaque (sem ser alarmante)
- Pendentes (☐) em sage gray

---

## Esqueleto da tela Check-in 1 — Humor

Tela #19 do inventário. Primeiro passo do check-in diário (de 4 telas: humor, ansiedade+energia, sono, medicação).

> **Decisão:** os **5 espíritos** são marca do Práxis e aparecem nos 3 temas como seletor primário. A nota do inventário "5 espíritos (Fofo) ou 0–10 (Clássico/Sério)" é resolvida assim: **Fofo mostra só os espíritos**; **Clássico** adiciona pequena âncora numérica (1, 3, 5, 7, 9) abaixo das labels; **Sério** mostra escala 0–10 explícita + tick na posição correspondente. Mesmo dado, mesmas opções, leituras diferentes.

| Y | Bloco | Altura | Conteúdo idêntico nas 3 versões |
|---|-------|--------|--------------------------------|
| 50–80 | Status bar | 30 | `13:29` · `5G ▮▮▮▯` |
| 90–135 | Header | 45 | Back `‹` + título centralizado `Check-in` + `···` |
| 155–195 | Step indicator | 40 | Texto `1 de 4` + 4 dots progresso (1ª preenchida) |
| 215–270 | Pergunta | 55 | Pergunta grande: `Como está seu humor agora?` (Fofo lower) |
| 285–305 | Subtítulo | 20 | `Escolha o que mais combina com você hoje` |
| 350–490 | 5 espíritos | 140 | Linha horizontal com 5 espíritos (centro y=420, raio 30): <br> 1. **Radical** — bambu `#7FA265` <br> 2. **Bem** — folha-nova `#A8C58A` (selecionado) <br> 3. **Mais ou menos** — lanterna `#D8C170` <br> 4. **Mal** — terracota `#C97956` <br> 5. **Horrível** — anoitecer `#7B6388` <br> Selecionado tem anel; nome embaixo de cada |
| 510–650 | Card "Detalhe do humor" | 140 | Label `SUA ESCOLHA` + nome `Bem` + descrição `Um dia leve, com vento.` + (Clássico/Sério) anotação `~7/10` |
| 720–790 | Continue CTA | 70 | Botão grande `Continuar →` |
| 800–860 | Skip | 60 | Link discreto `Pular esta pergunta` centralizado |

### Expressão dos 5 espíritos (consistente nos 3 temas)

| Espírito | Olhos | Boca | Bochechas (Fofo) | Cor |
|----------|-------|------|------------------|-----|
| Radical | curvas para cima `^_^` | sorriso largo | rosa | bambu |
| Bem | curvas suaves | sorriso pequeno | rosa fraco | folha-nova |
| Mais ou menos | pontos | linha reta | nenhuma | lanterna |
| Mal | ovais para baixo | curva pequena para baixo | nenhuma | terracota |
| Horrível | curvas para baixo | curva grande para baixo | nenhuma | anoitecer |

