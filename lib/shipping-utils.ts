export function calculateCartPhysicalSummary(items: any[]) {
  let totalWeightGrams = 0
  let totalVolumeCm3 = 0

  for (const item of items) {
    const quantity = item.quantity || 1

    // 📦 Datos desde metadata del producto en Medusa
    const weight = Number(item.variant?.metadata?.weight_grams || 0)
    const length = Number(item.variant?.metadata?.length_cm || 0)
    const width = Number(item.variant?.metadata?.width_cm || 0)
    const height = Number(item.variant?.metadata?.height_cm || 0)

    // ⚖️ Peso total
    totalWeightGrams += weight * quantity

    // 📐 Volumen total
    const volume = length * width * height
    totalVolumeCm3 += volume * quantity
  }

  return {
    totalWeightKg: totalWeightGrams / 1000,
    totalWeightGrams,
    totalVolumeCm3,
  }
}