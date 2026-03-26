export function buildNationalShippingPayload(data: {
  destinationCity: string
  destinationState: string
  destinationPostalCode: string
  weightKg: number
}) {
  return {
    destinationCity: data.destinationCity,
    destinationState: data.destinationState,
    destinationPostalCode: data.destinationPostalCode,
    weightKg: data.weightKg,
    declaredValue: 0,
  }
}

export function getNationalShippingPreviewText(payload: any) {
  return `Envío nacional estimado a ${payload.destinationCity} (${payload.weightKg.toFixed(
    2
  )} kg). La tarifa final se calculará con la transportadora.`
}