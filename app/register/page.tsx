"use client"

import Link from "next/link"
import { useState } from "react"
import { medusa } from "../../lib/medusa"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!email || !password || !confirmPassword) {
        throw new Error("Debes completar todos los campos.")
      }

      if (password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden.")
      }

      if (password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres.")
      }

      // Paso 1: crear identidad/auth
      await medusa.auth.register("customer", "emailpass", {
        email,
        password,
      })

      // Paso 2: crear customer real en Medusa
      await medusa.store.customer.create({
        email,
      })

      setSuccess(
        "Cuenta creada correctamente. Ahora puedes iniciar sesión en la plataforma B2B."
      )

      setEmail("")
      setPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      console.error(err)
      setError(
        err?.message ||
          "No fue posible crear la cuenta. Si tu acceso comercial ya fue aprobado, por favor contacta a Movitec Games."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Activación de cuenta
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Crear cuenta B2B
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          Esta página es únicamente para tiendas que ya fueron aprobadas por
          Movitec Games y recibieron el enlace de activación.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Confirmar contraseña
            </label>
            <input
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Si no has sido aprobado comercialmente todavía, no uses esta página.
          Primero debes completar la solicitud de acceso y esperar validación.
        </div>

        <div className="mt-6 flex flex-col gap-3 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-900 underline"
          >
            Ya tengo cuenta, quiero iniciar sesión
          </Link>

          <Link
            href="/solicitar-acceso"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Solicitar acceso comercial
          </Link>
        </div>
      </div>
    </main>
  )
}