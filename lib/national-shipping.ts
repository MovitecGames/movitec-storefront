export function buildNationalShippingPayload(items: any[]) {
  let totalWeightGrams = 0

  for (const item of items) {
    const quantity = item.quantity || 1
    const weight = Number(item.variant?.metadata?.weight_g || 0)

    totalWeightGrams += weight * quantity
  }

  return {
    totalWeightKg: totalWeightGrams / 1000,
    declaredValue: items.reduce((acc, item) => {
      return acc + (item.unit_price || 0) * (item.quantity || 1)
    }, 0),
  }
}

export function getNationalShippingPreviewText(payload: any) {
  return `Envío nacional estimado para ${payload.totalWeightKg.toFixed(
    2
  )} kg. La tarifa final se calculará con la transportadora.`
}