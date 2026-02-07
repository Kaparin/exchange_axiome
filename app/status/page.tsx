export default function StatusPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-10">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-semibold">Exchange Axiome</h1>
        <p className="mt-3 text-gray-600">Сервис запущен.</p>
        <p className="mt-2 text-sm text-gray-500">
          Настройка webhook: /api/telegram/setup?key=ADMIN_API_KEY
        </p>
      </div>
    </main>
  )
}
