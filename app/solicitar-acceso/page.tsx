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
    tipoTienda: "",
    retenciones: "",
    cualesRetenciones: "",
    tarifaRetenciones: "",
    canalesVenta: "",
    observaciones: "",
  })

  const onChange =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

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
      `- Tipo de tienda: ${form.tipoTienda}`,
      `- ¿Aplica retenciones?: ${form.retenciones}`,
      `- ¿Cuáles retenciones?: ${form.retenciones === "Sí" ? form.cualesRetenciones : "No aplica"}`,
      `- Tarifa de retenciones: ${form.retenciones === "Sí" ? form.tarifaRetenciones : "No aplica"}`,
      `- Canales de venta: ${form.canalesVenta}`,
      `- Observaciones: ${form.observaciones}`,
      "",
      "Adjuntaré Cámara de Comercio y RUT.",
    ].join("\n")
  }, [form])

  const mailtoHref = `mailto:ventas@movitecgames.com?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Volver al inicio
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Solicitud comercial
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Solicitar acceso comercial
            </h1>

            <p className="mt-4 text-slate-600">
              Completa la información de tu tienda para iniciar el proceso de
              validación comercial con Movitec Games.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Razón social
                </label>
                <input
                  value={form.razonSocial}
                  onChange={onChange("razonSocial")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Ej. Segunda Pruebas SAS"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">NIT</label>
                <input
                  value={form.nit}
                  onChange={onChange("nit")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Ej. 9009908098"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Ciudad</label>
                <input
                  value={form.ciudad}
                  onChange={onChange("ciudad")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Ej. Bogotá"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nombre del contacto
                </label>
                <input
                  value={form.contacto}
                  onChange={onChange("contacto")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Ej. Pepo Pérez"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={onChange("telefono")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Ej. 3246565800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Correo</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={onChange("correo")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="correo@empresa.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Tipo de tienda
                </label>
                <select
                  value={form.tipoTienda}
                  onChange={onChange("tipoTienda")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="">Selecciona</option>
                  <option value="Física">Física</option>
                  <option value="Online">Online</option>
                  <option value="Física y online">Física y online</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  ¿Aplica retenciones?
                </label>
                <select
                  value={form.retenciones}
                  onChange={onChange("retenciones")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="">Selecciona</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>

              {form.retenciones === "Sí" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      ¿Cuáles retenciones aplica?
                    </label>
                    <input
                      value={form.cualesRetenciones}
                      onChange={onChange("cualesRetenciones")}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Ej. ReteFuente, ICA, otra"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      ¿Qué tarifa aplica?
                    </label>
                    <input
                      value={form.tarifaRetenciones}
                      onChange={onChange("tarifaRetenciones")}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Ej. 2.5%, 3.5 x 1000"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Canales de venta
                </label>
                <input
                  value={form.canalesVenta}
                  onChange={onChange("canalesVenta")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Ej. Tienda física, web, Instagram, marketplaces"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Observaciones
                </label>
                <textarea
                  rows={5}
                  value={form.observaciones}
                  onChange={onChange("observaciones")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Cuéntanos algo relevante sobre tu tienda"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={mailtoHref}
                className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Enviar solicitud por correo
              </a>

              <Link
                href="/login"
                className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ya tengo acceso
              </Link>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-950 p-8 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Documentación requerida
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Qué debes enviar
              </h2>

              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                <li>• Cámara de Comercio vigente</li>
                <li>• RUT actualizado</li>
                <li>• Datos del contacto comercial</li>
                <li>• Información sobre retenciones aplicables</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Procedimiento
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Cómo funciona el acceso
              </h2>

              <ol className="mt-6 space-y-4 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">1.</span>{" "}
                  Envías la solicitud y adjuntas la documentación comercial requerida.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">2.</span>{" "}
                  Movitec Games revisa y valida la información de tu tienda.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">3.</span>{" "}
                  Si tu solicitud es aprobada, te enviaremos el enlace para la creación
                  de cuenta o los datos de ingreso a la plataforma B2B.
                </li>
              </ol>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                El acceso a precios y condiciones comerciales solo se habilita después
                de la validación y aprobación de tu solicitud.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}