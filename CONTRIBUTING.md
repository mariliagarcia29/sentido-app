# Guia de Contribuição — Sentido

---

## Fluxo de trabalho

1. Crie uma branch a partir de `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feat/nome-da-feature
   ```

2. Faça commits pequenos e descritivos:
   ```
   feat(records): adicionar campo 'note' ao MoodEntry
   fix(auth): corrigir expiração do token refresh
   chore(deps): atualizar @nestjs/core para 11.1.0
   ```

3. Abra Pull Request para `develop` — nunca direto para `main`

4. PR requer:
   - CI passando (lint + testes)
   - Ao menos 1 aprovação
   - Sem conflitos

5. Merge em `main` dispara deploy automático em produção

---

## Padrões de código

### Backend (NestJS)

- Um módulo por domínio (`auth/`, `records/`, `consent/`...)
- Services contêm a lógica; Controllers apenas roteiam
- Todo endpoint protegido com `@UseGuards(JwtAuthGuard)` — exceto rotas públicas explícitas
- DTOs com `class-validator`: sempre `@MaxLength` em strings, `@IsEnum` em campos de opção
- Nunca retornar `passwordHash` — o `@Exclude()` na entidade cuida disso globalmente
- Testes unitários obrigatórios para Services com lógica de negócio

### Frontend Web (React)

- Componentes em `components/ui/` são genéricos e reutilizáveis
- Páginas em `pages/` não importam outras páginas
- Todo texto visível ao usuário via `i18n` (`t('chave')`) — nunca hardcoded
- Chamadas de API apenas via `src/api/index.ts`

### Mobile (React Native / Expo)

- Navegação tipada via `navigation/types.ts`
- Todas as chamadas de API via `services/api.ts`
- Strings de UI via `i18n/locales/` (PT-BR + EN-US + ES-ES)

---

## Variáveis de ambiente

- Nunca commitar `.env` — use `.env.example` como referência
- Segredos de produção ficam no AWS Secrets Manager
- Para desenvolvimento, preencher `.env` localmente

---

## Segurança

Antes de abrir PR com novos endpoints, verificar:

- [ ] Rota protegida com `@UseGuards(JwtAuthGuard)`?
- [ ] DTO tem `@MaxLength` em todos os campos `string`?
- [ ] Campos de enum usam `@IsEnum`?
- [ ] Dados de outro usuário verificados por ownership antes de retornar?
- [ ] Novo campo sensível na entidade `User` tem `@Exclude()`?

---

## Testes

```bash
# Unitários
cd backend && npm test

# E2E
cd backend && npm run test:e2e

# Type check (mobile)
cd mobile && npx tsc --noEmit
```

---

## Migrations de banco

Adicionar arquivos em `database/migrations/` com prefixo numérico sequencial:

```
004_nome_descritivo.sql
```

Testar localmente antes de commitar:

```bash
psql sentido < database/migrations/004_nome_descritivo.sql
```
