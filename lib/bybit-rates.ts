// Функция для получения курса с биржи Bybit
import { getRedisClient } from "./redis"

// Время жизни кэша в секундах (10 минут)
const CACHE_TTL = 600

// Функция для получения курса с биржи Bybit
export async function getBybitRate(crypto: string, currency: string): Promise<number | null> {
  try {
    // Нормализуем входные данные
    crypto = crypto.toUpperCase()
    currency = currency.toUpperCase()

    console.log(`[Bybit] Запрос курса для пары ${crypto}/${currency}`)

    // Проверяем, поддерживается ли пара
    if (!isSupportedPair(crypto, currency)) {
      console.log(`[Bybit] Пара ${crypto}/${currency} не поддерживается Bybit`)
      return null
    }

    // Формируем ключ для кэша
    const cacheKey = `bybit_rate:${crypto}_${currency}`

    // Пытаемся получить курс из кэша
    const redis = getRedisClient()
    const cachedRate = await redis.get(cacheKey)

    if (cachedRate) {
      console.log(`[Bybit] Получен курс из кэша для ${crypto}/${currency}: ${cachedRate}`)
      return Number.parseFloat(cachedRate as string)
    }

    // Формируем символ пары для запроса
    const symbol = `${crypto}${currency}`

    // Запрос к Bybit API
    console.log(`[Bybit] Запрос курса с Bybit API для ${crypto}/${currency}, символ: ${symbol}`)

    // Используем правильный эндпоинт API Bybit v5
    const apiUrl = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`
    console.log(`[Bybit] URL запроса: ${apiUrl}`)

    const response = await fetch(apiUrl)

    if (!response.ok) {
      if (response.status === 403) {
        console.error(`[Bybit] Доступ запрещен (403). Возможно, превышен лимит запросов или требуется API ключ`)
      } else {
        console.error(`[Bybit] Ошибка при запросе курса Bybit: ${response.status} ${response.statusText}`)
      }
      // Return null instead of throwing to allow fallback to other sources
      return null
    }

    const data = await response.json()
    console.log(`[Bybit] Ответ API: ${JSON.stringify(data).substring(0, 500)}...`)

    // Проверяем успешность запроса
    if (data.retCode !== 0 || !data.result || !data.result.list || data.result.list.length === 0) {
      console.error(`[Bybit] Ошибка в ответе Bybit API: ${JSON.stringify(data)}`)
      return null
    }

    // Получаем последнюю цену
    const lastPrice = Number.parseFloat(data.result.list[0].lastPrice)

    if (isNaN(lastPrice)) {
      console.error(`[Bybit] Некорректная цена от Bybit API: ${data.result.list[0].lastPrice}`)
      return null
    }

    console.log(`[Bybit] Получен курс для ${crypto}/${currency}: ${lastPrice}`)

    // Сохраняем курс в кэш
    await redis.set(cacheKey, lastPrice.toString(), { ex: CACHE_TTL })
    console.log(`[Bybit] Курс для ${crypto}/${currency} сохранен в кэш: ${lastPrice}`)

    return lastPrice
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Bybit] Ошибка при получении курса с Bybit для ${crypto}/${currency}: ${error.message}`)
    } else {
      console.error(`[Bybit] Неизвестная ошибка при получении курса с Bybit для ${crypto}/${currency}:`, error)
    }
    return null
  }
}

// Функция для проверки поддерживаемых пар
function isSupportedPair(crypto: string, currency: string): boolean {
  // Основные криптовалюты
  const supportedCryptos = ["BTC", "ETH", "USDT", "BNB", "XRP", "SOL", "ADA", "DOGE", "DOT", "MATIC"]

  // Основные фиатные валюты и стейблкоины
  const supportedCurrencies = ["USD", "USDT", "USDC"]

  // Bybit не поддерживает напрямую RUB и EUR, поэтому исключаем их

  // Проверяем, поддерживается ли пара
  return supportedCryptos.includes(crypto) && supportedCurrencies.includes(currency)
}

// Функция для получения курса с процентным изменением
export async function getBybitRateWithPercentage(
  crypto: string,
  currency: string,
  percentage: number,
): Promise<number | null> {
  const rate = await getBybitRate(crypto, currency)

  if (rate === null) {
    return null
  }

  // Применяем процентное изменение
  return rate * (1 + percentage / 100)
}

// Функция для получения вариантов курса
export async function getBybitRateOptions(
  crypto: string,
  currency: string,
): Promise<{ market: number; options: Array<{ percentage: number; rate: number }> } | null> {
  const marketRate = await getBybitRate(crypto, currency)

  if (marketRate === null) {
    return null
  }

  // Создаем варианты курса
  const percentages = [-5, 0, 5]
  const options = percentages.map((percentage) => ({
    percentage,
    rate: Number((marketRate * (1 + percentage / 100)).toFixed(2)),
  }))

  return {
    market: marketRate,
    options,
  }
}

// Функция для форматирования курса с учетом валюты
export function formatRate(rate: number, currency: string): string {
  // Определяем количество десятичных знаков в зависимости от валюты
  let decimals = 2

  if (currency.toUpperCase() === "BTC" || currency.toUpperCase() === "ETH") {
    decimals = 8
  } else if (currency.toUpperCase() === "RUB" || currency.toUpperCase() === "USD") {
    decimals = 2
  }

  return rate.toFixed(decimals)
}

// Функция для очистки кэша курсов
export async function clearRatesCache(): Promise<void> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys("bybit_rate:*")

    if (keys.length > 0) {
      await redis.del(keys)
      console.log(`Очищен кэш курсов: ${keys.length} записей`)
    }
  } catch (error) {
    console.error("Ошибка при очистке кэша курсов:", error)
  }
}

// Функция для получения курса через кросс-конвертацию (например, для RUB и EUR)
export async function getBybitCrossRate(crypto: string, targetCurrency: string): Promise<number | null> {
  try {
    console.log(`[Bybit] Запрос кросс-курса для ${crypto}/${targetCurrency}`)

    // Для валют, которые не поддерживаются напрямую, используем USDT как промежуточную валюту
    const usdtRate = await getBybitRate(crypto, "USDT")
    if (!usdtRate) {
      console.log(`[Bybit] Не удалось получить курс ${crypto}/USDT для кросс-конвертации`)
      return null
    }

    // Получаем курс USDT к целевой валюте из внешнего источника
    // Для примера используем фиксированные курсы, в реальном приложении нужно использовать API
    let usdtToTarget: number | null = null

    if (targetCurrency === "RUB") {
      // Примерный курс USDT к RUB
      usdtToTarget = 90.5
    } else if (targetCurrency === "EUR") {
      // Примерный курс USDT к EUR
      usdtToTarget = 0.92
    }

    if (!usdtToTarget) {
      console.log(`[Bybit] Не удалось получить курс USDT/${targetCurrency} для кросс-конвертации`)
      return null
    }

    // Вычисляем кросс-курс
    const crossRate = usdtRate * usdtToTarget
    console.log(`[Bybit] Кросс-курс для ${crypto}/${targetCurrency}: ${crossRate} (через USDT)`)

    return crossRate
  } catch (error) {
    console.error(`[Bybit] Ошибка при получении кросс-курса для ${crypto}/${targetCurrency}:`, error)
    return null
  }
}
