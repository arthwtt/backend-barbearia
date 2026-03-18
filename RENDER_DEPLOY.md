# Deploy no Render

## O que este projeto agora suporta

- Build via `Dockerfile`
- Frontend e backend servidos pelo mesmo container
- Configuracao do banco por variaveis de ambiente
- Migrations automaticas no boot
- Seeds opcionais com `RUN_SEEDS=true`

## Variaveis obrigatorias

- `TOKEN_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Ou, alternativamente:

- `DATABASE_URL`
- `TOKEN_SECRET`

## Variaveis opcionais

- `NODE_ENV=production`
- `APP_BASE_URL=https://SEU-SERVICO.onrender.com`
- `RUN_SEEDS=false`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=false`
- `DB_TIMEZONE=-03:00`

## Observacao importante

O Render vai subir o container da aplicacao, mas o banco ainda precisa existir fora do container ou em outro servico apropriado. Este projeto nao embute um MySQL persistente dentro do mesmo container.

## Primeiro deploy

1. Crie o Web Service no Render usando este repositorio.
2. Deixe o Render detectar o `Dockerfile`.
3. Configure as variaveis de ambiente.
4. Aponte `APP_BASE_URL` para a URL publica do Render.
5. Se quiser popular dados iniciais uma unica vez, suba com `RUN_SEEDS=true` e depois volte para `false`.
6. Acesse `/health` para testar a aplicacao.
7. Acesse `/docs` para a documentacao Swagger.
