"use client"

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const nextPath = searchParams.get("next") || "/admin/pedidos"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setLoading(true)
      setErrorMessage("")

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        setErrorMessage(data?.error || "No fue posible iniciar sesión.")
        return
      }

      router.push(nextPath)
      router.refresh()
    } catch (error) {
      console.error("[ADMIN_LOGIN_PAGE] unexpected error", error)
      setErrorMessage("Ocurrió un error iniciando sesión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              ← Volver al catálogo
            </Link>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Acceso administrativo
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Ingresar a gestión comercial
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Ingresa la clave privada para acceder al panel de administración de pedidos.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Clave de acceso
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-900"
                placeholder="Ingresa la clave"
                autoComplete="current-password"
                required
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Validando acceso..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}