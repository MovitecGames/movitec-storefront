"use client"

import Link from "next/link"
import { useState } from "react"
import { medusa } from "../../lib/medusa"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await medusa.auth.login("customer", "emailpass", {
        email,
        password,
      })

      // Validación inmediata de que ya puede leerse el customer desde browser
      await medusa.store.customer.retrieve()

      window.location.href = "/"
    } catch (err) {
      console.error(err)
      setError("No fue posible iniciar sesión. Verifica tus credenciales o solicita acceso comercial.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">
          Ingresar como tienda
        </h1>

        <p className="mb-6 text-center text-sm text-slate-600">
          Si ya eres un usuario aprobado, ingresa tus credenciales para acceder a la plataforma B2B.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-3"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border p-3"
          />

          <button
            disabled={loading}
            className="w-full rounded bg-black p-3 text-white disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          Si no tienes una cuenta habilitada, debes solicitar el acceso comercial.
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/solicitar-acceso"
            className="text-sm font-semibold text-slate-900 underline"
          >
            Solicitar acceso comercial
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}