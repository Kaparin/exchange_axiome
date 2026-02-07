import crypto from "crypto"

// Получаем ключ шифрования из переменных окружения или используем запасной ключ
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-for-development-only"

// Алгоритм шифрования
const ALGORITHM = "aes-256-cbc"

// Функция для шифрования данных
export function encrypt(text: string): string {
  try {
    // Создаем случайный вектор инициализации
    const iv = crypto.randomBytes(16)

    // Создаем ключ на основе ENCRYPTION_KEY
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

    // Создаем шифр
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Шифруем данные
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Возвращаем зашифрованные данные с вектором инициализации
    // IV добавляется в начало, чтобы его можно было извлечь при дешифровании
    return iv.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

// Функция для дешифрования данных
export function decrypt(encryptedText: string): string {
  try {
    // Разделяем вектор инициализации и зашифрованные данные
    const parts = encryptedText.split(":")
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format")
    }

    const iv = Buffer.from(parts[0], "hex")
    const encrypted = parts[1]

    // Создаем ключ на основе ENCRYPTION_KEY
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

    // Создаем дешифр
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    // Дешифруем данные
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

// Функция для хеширования пароля с солью
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  try {
    // Если соль не предоставлена, генерируем новую
    const useSalt = salt || crypto.randomBytes(16).toString("hex")

    // Хешируем пароль с солью
    const hash = crypto.pbkdf2Sync(password, useSalt, 1000, 64, "sha512").toString("hex")

    return { hash, salt: useSalt }
  } catch (error) {
    console.error("Password hashing error:", error)
    throw new Error("Failed to hash password")
  }
}

// Функция для проверки пароля
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    // Хешируем введенный пароль с той же солью
    const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")

    // Сравниваем хеши
    return hashVerify === hash
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}

// Функция для генерации API ключа
export function generateApiKey(): string {
  try {
    // Генерируем случайный буфер и преобразуем его в строку
    return crypto.randomBytes(32).toString("hex")
  } catch (error) {
    console.error("API key generation error:", error)
    throw new Error("Failed to generate API key")
  }
}

// Функция для проверки API ключа
export function verifyApiKey(providedKey: string, storedKey: string): boolean {
  try {
    // Сравниваем ключи с использованием crypto.timingSafeEqual для предотвращения атак по времени
    return crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(storedKey))
  } catch (error) {
    console.error("API key verification error:", error)
    return false
  }
}

// Helper functions for hashing and verification
export function hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}

export function verifyHash(data: string, hash: string): boolean {
  return hash === crypto.createHash("sha256").update(data).digest("hex")
}

// Helper function to generate a token
export function generateToken(length: number): string {
  return crypto.randomBytes(length).toString("hex")
}
