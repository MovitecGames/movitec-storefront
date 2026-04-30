"use client"

import Link from "next/link"
import { useState } from "react"
import { medusa } from "../../lib/medusa"

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")
    setError("")

    if (!email.trim()) {
      setError("Debes ingresar el correo asociado a tu cuenta.")
      return
    }

    try {
      setLoading(true)

      await medusa.auth.resetPassword("customer", "emailpass", {
        identifier: email.trim(),
      })

      setMessage(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
      )
      setEmail("")
    } catch (err) {
      console.error(err)
      setError(
        "No fue posible solicitar el restablecimiento en este momento. Intenta nuevamente."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">
          Recuperar contraseña
        </h1>

        <p className="mb-6 text-center text-sm text-slate-600">
          Ingresa el correo asociado a tu cuenta B2B. Si existe una cuenta
          registrada, enviaremos las instrucciones para restablecer la contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-3"
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black p-3 text-white disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar instrucciones"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-900 underline"
          >
            Volver al login
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}