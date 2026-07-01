# Netlify Deploy Instructions

## O que enviar para o Netlify

Envie o diretório inteiro do projeto, incluindo:

- `netlify.toml`
- `netlify/functions/teams-notify.js`
- `dist/` (após build)
- `src/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`

> Se você estiver enviando pelo Netlify Drop, use o ZIP do projeto completo.

## Arquivos principais

### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  functions = "netlify/functions"
```

### `netlify/functions/teams-notify.js`
```js
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST', 'Content-Type': 'text/plain' },
      body: 'Method Not Allowed'
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid JSON payload.'
    };
  }

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL || process.env.VITE_TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Teams webhook URL is not configured.'
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Content-Type': 'text/plain' },
      body: response.ok ? 'OK' : responseText || `Teams webhook error: ${response.status}`
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Request to Teams webhook failed: ${error.message}`
    };
  }
};
```

## Variável de ambiente no Netlify

No painel do Netlify, crie uma variável de ambiente:

- `Key`: `TEAMS_WEBHOOK_URL`
- `Value`: `https://webhookbot.c-toss.com/api/bot/webhooks/767e9ccc-e7de-49cb-a87a-d3af5a251809`

Use a opção `Production`.

## Deploy

1. Faça o build localmente:

```bash
npm run build
```

2. Envie o projeto completo para o Netlify.
3. Garanta que o deploy use a versão atualizada.
4. Teste no site publicado.

## Observação

Se estiver usando Netlify Drop, envie o ZIP do projeto completo. Se estiver usando o repositório, conecte o repo ao Netlify e faça o deploy a partir dele.
