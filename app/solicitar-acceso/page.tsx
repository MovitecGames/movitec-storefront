"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

export default function SolicitarAccesoPage() {
  const [form, setForm] = useState({
    razonSocial: "",
    nit: "",
    ciudad: "",
    contacto: "",
    telefono: "",
    correo: "",
    retenciones: "",
    canalesVenta: "",
    observaciones: "",
  })

  const subject = "Solicitud de acceso comercial B2B Movitec Games"

  const body = useMemo(() => {
    return [
      "Hola Movitec Games,",
      "",
      "Deseo solicitar acceso comercial B2B.",
      "",
      "Datos de mi tienda:",
      `- Razón social: ${form.razonSocial}`,
      `- NIT: ${form.nit}`,
      `- Ciudad: ${form.ciudad}`,
      `- Nombre del contacto: ${form.contacto}`,
      `- Teléfono: ${form.telefono}`,
      `- Correo: ${form.correo}`,
      `- ¿Practica retenciones?: ${form.retenciones}`,
      `- Canales de venta: ${form.canalesVenta}`,
      `- Observaciones: ${form.observaciones}`,
      "",
      "Adjuntaré Cámara de Comercio y RUT.",
    ].join("\n")
  }, [form])

  const mailtoHref = `mailto:ventas@movitecgames.com?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`

  const onChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Volver al sitio
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Solicitud comercial
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Solicitar acceso B2B
            </h1>
            <p className="mt-4 text-slate-600">
              Completa tus datos comerciales. Después podrás enviar tu solicitud
              por correo a nuestro equipo para revisión.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Razón social</label>
                <input
                  value={form.razonSocial}
                  onChange={onChange("razonSocial")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">NIT</label>
                <input
                  value={form.nit}
                  onChange={onChange("nit")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Ciudad</label>
                <input
                  value={form.ciudad}
                  onChange={onChange("ciudad")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Nombre del contacto</label>
                <input
                  value={form.contacto}
                  onChange={onChange("contacto")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={onChange("telefono")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Correo</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={onChange("correo")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">¿Practica retenciones?</label>
                <select
                  value={form.retenciones}
                  onChange={onChange("retenciones")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="">Selecciona</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                  <option value="Por confirmar">Por confirmar</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Canales de venta</label>
                <input
                  value={form.canalesVenta}
                  onChange={onChange("canalesVenta")}
                  placeholder="Tienda física, web, redes, marketplaces..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Observaciones</label>
                <textarea
                  rows={5}
                  value={form.observaciones}
                  onChange={onChange("observaciones")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={mailtoHref}
                className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Enviar solicitud
              </a>

              <Link
                href="/login"
                className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ya tengo acceso
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl bg-slate-950 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Requisitos
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Documentación para revisión
            </h2>

            <ul className="mt-6 space-y-4 text-sm text-slate-300">
              <li>• Cámara de Comercio vigente</li>
              <li>• RUT actualizado</li>
              <li>• Datos del contacto comercial</li>
              <li>• Confirmación de manejo de retenciones</li>
              <li>• Información básica de canales de venta</li>
            </ul>

            <div className="mt-8 rounded-2xl bg-white/5 p-5">
              <p className="text-sm font-semibold">Importante</p>
              <p className="mt-2 text-sm text-slate-300">
                El acceso B2B y la visualización de condiciones comerciales se habilitan
                únicamente después de la validación de tu solicitud.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}