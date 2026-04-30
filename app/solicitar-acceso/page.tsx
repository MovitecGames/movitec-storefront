"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

export default function SolicitarAccesoPage() {
  const [form, setForm] = useState({
    razonSocial: "",
    nit: "",
    ciudad: "",
    direccionEmpresa: "",
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

  const resumenSolicitud = useMemo(() => {
    return [
      `Razón social: ${form.razonSocial}`,
      `NIT: ${form.nit}`,
      `Ciudad: ${form.ciudad}`,
      `Dirección de la empresa: ${form.direccionEmpresa}`,
      `Nombre del contacto: ${form.contacto}`,
      `Teléfono: ${form.telefono}`,
      `Correo: ${form.correo}`,
      `Tipo de tienda: ${form.tipoTienda}`,
      `¿Aplica retenciones?: ${form.retenciones}`,
      `¿Cuáles retenciones?: ${
        form.retenciones === "Sí" ? form.cualesRetenciones : "No aplica"
      }`,
      `Tarifa de retenciones: ${
        form.retenciones === "Sí" ? form.tarifaRetenciones : "No aplica"
      }`,
      `Canales de venta: ${form.canalesVenta}`,
      `Observaciones: ${form.observaciones}`,
    ].join("\n")
  }, [form])

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

            <form
              action="https://formsubmit.co/ventas@movitecgames.com"
              method="POST"
              className="mt-8"
            >
              <input
                type="hidden"
                name="_subject"
                value="Solicitud de acceso comercial B2B Movitec Games"
              />

              <input
                type="hidden"
                name="_template"
                value="table"
              />

              <input
                type="hidden"
                name="_captcha"
                value="false"
              />

              <input
                type="hidden"
                name="_next"
                value="https://www.movitecgames.com/solicitar-acceso?enviado=true"
              />

              <input
                type="hidden"
                name="Resumen de la solicitud"
                value={resumenSolicitud}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Razón social
                  </label>
                  <input
                    name="Razón social"
                    value={form.razonSocial}
                    onChange={onChange("razonSocial")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Ej. Segunda Pruebas SAS"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">NIT</label>
                  <input
                    name="NIT"
                    value={form.nit}
                    onChange={onChange("nit")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Ej. 9009908098"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Ciudad</label>
                  <input
                    name="Ciudad"
                    value={form.ciudad}
                    onChange={onChange("ciudad")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Ej. Bogotá"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Dirección de la empresa
                  </label>
                  <input
                    name="Dirección de la empresa"
                    value={form.direccionEmpresa}
                    onChange={onChange("direccionEmpresa")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Ej. Calle 123 #45-67"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Nombre del contacto
                  </label>
                  <input
                    name="Nombre del contacto"
                    value={form.contacto}
                    onChange={onChange("contacto")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Ej. Pepo Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Teléfono</label>
                  <input
                    name="Teléfono"
                    value={form.telefono}
                    onChange={onChange("telefono")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Ej. 3246565800"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Correo</label>
                  <input
                    type="email"
                    name="Correo"
                    value={form.correo}
                    onChange={onChange("correo")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="correo@empresa.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Tipo de tienda
                  </label>
                  <select
                    name="Tipo de tienda"
                    value={form.tipoTienda}
                    onChange={onChange("tipoTienda")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    required
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
                    name="¿Aplica retenciones?"
                    value={form.retenciones}
                    onChange={onChange("retenciones")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    required
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
                        name="¿Cuáles retenciones aplica?"
                        value={form.cualesRetenciones}
                        onChange={onChange("cualesRetenciones")}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                        placeholder="Ej. ReteFuente, ICA, otra"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        ¿Qué tarifa aplica?
                      </label>
                      <input
                        name="Tarifa de retenciones"
                        value={form.tarifaRetenciones}
                        onChange={onChange("tarifaRetenciones")}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                        placeholder="Ej. 2.5%, 3.5 x 1000"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Canales de venta
                  </label>
                  <input
                    name="Canales de venta"
                    value={form.canalesVenta}
                    onChange={onChange("canalesVenta")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Ej. Tienda física, web, Instagram, marketplaces"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Observaciones
                  </label>
                  <textarea
                    name="Observaciones"
                    rows={5}
                    value={form.observaciones}
                    onChange={onChange("observaciones")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Cuéntanos algo relevante sobre tu tienda"
                  />
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Después de enviar la solicitud, recuerda remitir Cámara de
                Comercio vigente y RUT actualizado a{" "}
                <span className="font-semibold">ventas@movitecgames.com</span>.
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Enviar solicitud comercial
                </button>

                <Link
                  href="/login"
                  className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ya tengo acceso
                </Link>
              </div>
            </form>
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
                <li>• Dirección y datos de la empresa</li>
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
                  Envías la solicitud y remites la documentación comercial
                  requerida.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">2.</span>{" "}
                  Movitec Games revisa y valida la información de tu tienda.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">3.</span>{" "}
                  Si tu solicitud es aprobada, te enviaremos el enlace para la
                  creación de cuenta o los datos de ingreso a la plataforma B2B.
                </li>
              </ol>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                El acceso a precios y condiciones comerciales solo se habilita
                después de la validación y aprobación de tu solicitud.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}