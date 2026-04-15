export function calculateBogotaShipping(args: {
  distanceKm: number
  weightKg: number
}) {
  // Modelo económico para Bogotá:
  // - Base mínima competitiva
  // - Recargo por km moderado
  // - Recargo por peso suave
  // - Redondeo comercial al peso

  const KM_RATE = 1000
  const KG_RATE = 400
  const MIN_PRICE = 8000

  const safeDistance = Number.isFinite(args.distanceKm) ? Math.max(args.distanceKm, 0) : 0
  const safeWeight = Number.isFinite(args.weightKg) ? Math.max(args.weightKg, 0) : 0

  const distanceCost = safeDistance * KM_RATE
  const weightCost = safeWeight * KG_RATE
  const rawTotal = distanceCost + weightCost
  const finalPrice = Math.max(rawTotal, MIN_PRICE)

  return {
    kmRate: KM_RATE,
    kgRate: KG_RATE,
    minPrice: MIN_PRICE,
    distanceCost,
    weightCost,
    rawTotal,
    finalPrice: Math.round(finalPrice),
  }
}
