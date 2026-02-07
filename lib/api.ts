// Функция для получения курса криптовалюты
export async function getCryptoRate(crypto: string, currency: string): Promise<number | null> {
  try {
    console.log(`Getting rate for ${crypto} in ${currency}`)

    // Используем CoinGecko API для получения курса
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinId(crypto)}&vs_currencies=${currency.toLowerCase()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "TelegramBot/1.0",
        },
      },
    )

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
    return price
  } catch (error) {
    console.error(`Error getting crypto rate for ${crypto} in ${currency}:`, error)
    return null
  }
}

// Функция для получения вариантов курса
export async function getCryptoRateOptions(
  crypto: string,
  currency: string,
): Promise<{ market: number; options: Array<{ percentage: number; rate: number }> } | null> {
  try {
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
  } catch (error) {
    console.error(`Error getting crypto rate options for ${crypto} in ${currency}:`, error)
    return null
  }
}

// Вспомогательная функция для получения ID монеты для CoinGecko API
function getCoinId(symbol: string): string {
  const symbolMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    USDC: "usd-coin",
    BNB: "binancecoin",
    XRP: "ripple",
    ADA: "cardano",
    SOL: "solana",
    DOGE: "dogecoin",
    DOT: "polkadot",
  }

  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase()
}
