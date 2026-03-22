"use client"

import { useState } from "react"
import { medusa } from "../../lib/medusa"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleRegister = async (e: any) => {
    e.preventDefault()

    try {
    await medusa.store.customer.create({
       email,
       password,
       metadata: {
    approved: false,
      },
        }) 
      setMessage("Cuenta creada. Ya puedes iniciar sesión.")
    } catch (err) {
      console.error(err)
      setMessage("Error al crear cuenta")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-6 text-center">
          Solicitar acceso B2B
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Correo empresarial"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <input
            type="password"
            placeholder="Crear contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <button className="w-full bg-black text-white p-3 rounded">
            Solicitar acceso
          </button>
        </form>

        {message && (
          <p className="text-center text-sm mt-4">{message}</p>
        )}
      </div>
    </main>
  )
}