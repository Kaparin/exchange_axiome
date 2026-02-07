# Exchange Axiome

Telegram Mini App + Bot gateway для P2P‑обмена, перестроенный под WebApp‑ориентированный поток.

## Стек

- Next.js 14 (App Router)
- Telegraf v4
- Postgres (Neon) + Prisma
- Vercel (деплой)

## Запуск локально

1) Установить зависимости:
```bash
pnpm install
```

2) Заполнить `.env`:
```
BOT_TOKEN=...
WEBHOOK_URL=https://<vercel-domain>
WEBAPP_URL=https://<vercel-domain>
DATABASE_URL=postgresql://...
ADMIN_API_KEY=...
ADMIN_IDS=...
OPENAI_API_KEY=...
```

3) Запуск:
```bash
pnpm dev
```

## Telegram webhook

После деплоя вызвать:
```
https://<vercel-domain>/api/telegram/setup?key=ADMIN_API_KEY
```

## Основные маршруты

- WebApp: `/`
- Status page: `/status`
- Telegram webhook: `/api/telegram/webhook`
- Telegram setup: `/api/telegram/setup`
- Telegram auth: `/api/auth/telegram`
