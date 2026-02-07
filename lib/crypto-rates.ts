// Улучшаем кэширование курсов криптовалют

// Добавляем в начало файла
import redis from "./redis"

// Константы для кэширования
const CACHE_PREFIX = "crypto_rate:"
const CACHE_TTL = 300 // 5 минут в секундах

// Интерфейс для курса криптовалюты
interface CryptoRate {
  crypto: string
  currency: string
  rate: number
  lastUpdated: number
}

// Кэш для хранения курсов
const ratesCache: Record<string, CryptoRate> = {}

// Функция для получения курса криптовалюты
export async function getCryptoRate(crypto: string, currency: string): Promise<number | null> {
  try {
    // Нормализуем входные данные
    crypto = crypto.toUpperCase()
    currency = currency.toUpperCase()

    // Формируем ключ кэша
    const cacheKey = `${CACHE_PREFIX}${crypto}_${currency}`

    // Проверяем кэш
    const cachedRate = await redis.get(cacheKey)
    if (cachedRate) {
      console.log(`Using cached rate for ${crypto} in ${currency}: ${cachedRate}`)
      return Number.parseFloat(cachedRate as string)
    }

    console.log(`Getting rate for ${crypto} in ${currency} from API`)

    // Используем CoinGecko API для получения курса с таймаутом
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 секунд таймаут

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinId(crypto)}&vs_currencies=${currency.toLowerCase()}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "TelegramBot/1.0",
          },
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Error fetching crypto rate: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()
      const coinId = getCoinId(crypto)

      if (!data[coinId] || !data[coinId][currency.toLowerCase()]) {
        console.error(`No rate data found for ${crypto} in ${currency}`)
        return null
      }

      const price = data[coinId][currency.toLowerCase()]

      // Сохраняем в кэш
      await redis.set(cacheKey, price.toString(), { ex: CACHE_TTL })
      console.log(`Cached rate for ${crypto} in ${currency}: ${price}`)

      return price
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        console.error(`Timeout fetching rate for ${crypto} in ${currency}`)
      } else {
        console.error(`Error fetching rate for ${crypto} in ${currency}:`, fetchError)
      }

      // Пробуем использовать альтернативный API
      return await getAlternativeRate(crypto, currency, cacheKey)
    }
  } catch (error) {
    console.error(`Error getting crypto rate for ${crypto} in ${currency}:`, error)
    return null
  }
}

// Функция для получения ID криптовалюты в CoinGecko
function getCoinId(crypto: string): string {
  const mapping: Record<string, string> = {
    USDT: "tether",
    BTC: "bitcoin",
    ETH: "ethereum",
    TON: "the-open-network",
    USDC: "usd-coin",
    BNB: "binancecoin",
    XRP: "ripple",
    ADA: "cardano",
    DOGE: "dogecoin",
    SOL: "solana",
  }

  return mapping[crypto] || crypto.toLowerCase()
}

// Функция для получения кода валюты в CoinGecko
function getCoinGeckoCurrency(currency: string): string {
  const mapping: Record<string, string> = {
    RUB: "rub",
    USD: "usd",
    EUR: "eur",
    GEL: "gel",
  }

  return mapping[currency] || currency.toLowerCase()
}

// Функция для получения курса с процентным изменением
export async function getCryptoRateWithPercentage(
  crypto: string,
  currency: string,
  percentage: number,
): Promise<number | null> {
  const rate = await getCryptoRate(crypto, currency)

  if (rate === null) {
    return null
  }

  // Применяем процентное изменение
  return rate * (1 + percentage / 100)
}

// Функция для получения вариантов курса
export async function getCryptoRateOptions(
  crypto: string,
  currency: string,
): Promise<{ market: number; options: Array<{ percentage: number; rate: number }> } | null> {
  const marketRate = await getCryptoRate(crypto, currency)

  if (marketRate === null) {
    return null
  }

  // Создаем варианты курса
  const percentages = [-15, -10, -5, 0, 5, 10, 15]
  const options = percentages.map((percentage) => ({
    percentage,
    rate: Number((marketRate * (1 + percentage / 100)).toFixed(2)),
  }))

  return {
    market: marketRate,
    options,
  }
}

// Добавляем функцию для получения курса из альтернативного источника
async function getAlternativeRate(crypto: string, currency: string, cacheKey: string): Promise<number | null> {
  try {
    console.log(`Trying alternative API for ${crypto} in ${currency}`)

    // Используем альтернативный API (например, CryptoCompare)
    const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${crypto}&tsyms=${currency}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TelegramBot/1.0",
      },
    })

    if (!response.ok) {
      console.error(`Error fetching from alternative API: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (!data || !data[currency]) {
      console.error(`No rate data found in alternative API for ${crypto} in ${currency}`)
      return null
    }

    const price = data[currency]

    // Сохраняем в кэш
    await redis.set(cacheKey, price.toString(), { ex: CACHE_TTL })
    console.log(`Cached rate from alternative API for ${crypto} in ${currency}: ${price}`)

    return price
  } catch (error) {
    console.error(`Error getting rate from alternative API for ${crypto} in ${currency}:`, error)
    return null
  }
}
