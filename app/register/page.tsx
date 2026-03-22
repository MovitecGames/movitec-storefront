"use client"

import { useState } from "react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRegister = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      if (!res.ok) {
        throw new Error("Error creando cuenta")
      }

      setSuccess("Cuenta creada correctamente. Ya puedes iniciar sesión.")
      setEmail("")
      setPassword("")
    } catch (err) {
      setError("Error al crear cuenta")
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-xl font-bold mb-6 text-center">
          Crear cuenta B2B
        </h1>

        <input
          type="email"
          placeholder="Correo"
          className="w-full mb-4 border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full mb-4 border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-black text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        {error && (
          <p className="text-red-500 mt-4 text-center">{error}</p>
        )}

        {success && (
          <p className="text-green-600 mt-4 text-center">{success}</p>
        )}
      </div>
    </main>
  )
}