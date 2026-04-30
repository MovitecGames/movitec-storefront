"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { medusa } from "../../lib/medusa"

export default function RestablecerContrasenaPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const queryData = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        email: "",
        token: "",
      }
    }

    const searchParams = new URLSearchParams(window.location.search)

    return {
      email: searchParams.get("email") || "",
      token: searchParams.get("token") || "",
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")
    setError("")

    if (!queryData.email || !queryData.token) {
      setError(
        "El enlace de restablecimiento no es válido o está incompleto. Solicita uno nuevo."
      )
      return
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Debes ingresar y confirmar tu nueva contraseña.")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    try {
      setLoading(true)

      await medusa.auth.updateProvider(
        "customer",
        "emailpass",
        {
          email: queryData.email,
          password,
        },
        queryData.token
      )

      setMessage(
        "Tu contraseña fue actualizada correctamente. Ya puedes ingresar con tu nueva contraseña."
      )
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error(err)
      setError(
        "No fue posible restablecer la contraseña. El enlace puede haber expirado o no ser válido."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">
          Crear nueva contraseña
        </h1>

        <p className="mb-6 text-center text-sm text-slate-600">
          Ingresa una nueva contraseña para tu cuenta B2B.
        </p>

        {!queryData.email || !queryData.token ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
            El enlace de restablecimiento no es válido o está incompleto.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Cuenta: <span className="font-semibold">{queryData.email}</span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border p-3 pr-20"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded border p-3 pr-20"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showConfirmPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-black p-3 text-white disabled:opacity-60"
            >
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}

        {message && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            <p>{message}</p>

            <Link
              href="/login"
              className="mt-3 inline-flex font-semibold text-emerald-800 underline"
            >
              Ir al login
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/recuperar-contrasena"
            className="text-sm font-semibold text-slate-900 underline"
          >
            Solicitar nuevo enlace
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