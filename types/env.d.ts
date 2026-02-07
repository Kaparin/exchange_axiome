declare namespace NodeJS {
  interface ProcessEnv {
    BOT_TOKEN: string
    WEBHOOK_URL: string
    WEBAPP_URL?: string
    DATABASE_URL: string
    ADMIN_API_KEY?: string
    ADMIN_IDS?: string
    OPENAI_API_KEY?: string
  }
}
