export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" })
  return res.json() as Promise<T>
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  })
  return res.json() as Promise<T>
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  })
  return res.json() as Promise<T>
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE", credentials: "include" })
  return res.json() as Promise<T>
}
