import { NextResponse } from "next/server"

const ADMIN_COOKIE_NAME = "movitec_admin_session"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const password = String(body?.password || "").trim()

    const expectedPassword = process.env.ADMIN_ACCESS_PASSWORD || ""
    const cookieSecret = process.env.ADMIN_ACCESS_COOKIE_SECRET || ""

    if (!expectedPassword || !cookieSecret) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan las variables ADMIN_ACCESS_PASSWORD o ADMIN_ACCESS_COOKIE_SECRET.",
        },
        { status: 500 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { ok: false, error: "Debes ingresar la clave de acceso." },
        { status: 400 }
      )
    }

    if (password !== expectedPassword) {
      return NextResponse.json(
        { ok: false, error: "La clave de acceso es incorrecta." },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ ok: true })

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: cookieSecret,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    })

    return response
  } catch (error) {
    console.error("[ADMIN_LOGIN_ROUTE] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Ocurrió un error validando el acceso administrativo.",
      },
      { status: 500 }
    )
  }
}
