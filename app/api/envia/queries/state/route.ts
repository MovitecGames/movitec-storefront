import { NextRequest, NextResponse } from "next/server"
import { getStatesByCountry, findOfficialStateCode } from "../../../../../lib/envia/queries"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = String(searchParams.get("country") || "CO").trim()
    const state = String(searchParams.get("state") || "").trim()

    if (state) {
      const result = await findOfficialStateCode({
        country,
        stateName: state,
      })

      return NextResponse.json(result, {
        status: result.ok ? 200 : 404,
      })
    }

    const result = await getStatesByCountry(country)

    return NextResponse.json(result, {
      status: result.ok ? 200 : 502,
    })
  } catch (error) {
    console.error("[ENVIA_QUERIES_STATE] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Ocurrió un error consultando states en Queries API.",
      },
      { status: 500 }
    )
  }
}