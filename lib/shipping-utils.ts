function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function readWeight(metadata: Record<string, any> = {}) {
  return (
    toNumber(metadata.weight_g) ||
    toNumber(metadata.weight_grams) ||
    toNumber(metadata.weight) ||
    0
  )
}

function readLength(metadata: Record<string, any> = {}) {
  return toNumber(metadata.length_cm) || toNumber(metadata.length) || 0
}

function readWidth(metadata: Record<string, any> = {}) {
  return toNumber(metadata.width_cm) || toNumber(metadata.width) || 0
}

function readHeight(metadata: Record<string, any> = {}) {
  return toNumber(metadata.height_cm) || toNumber(metadata.height) || 0
}

export function calculateCartPhysicalSummary(items: any[]) {
  let totalWeightGrams = 0
  let totalVolumeCm3 = 0

  for (const item of items) {
    const quantity = Number(item.quantity || 1)

    const lineMetadata = item.metadata || {}
    const variantMetadata = item.variant?.metadata || {}

    const weight = readWeight(lineMetadata) || readWeight(variantMetadata)
    const length = readLength(lineMetadata) || readLength(variantMetadata)
    const width = readWidth(lineMetadata) || readWidth(variantMetadata)
    const height = readHeight(lineMetadata) || readHeight(variantMetadata)

    totalWeightGrams += weight * quantity
    totalVolumeCm3 += length * width * height * quantity
  }

  return {
    totalWeightGrams,
    totalWeightKg: totalWeightGrams / 1000,
    totalVolumeCm3,
  }
}