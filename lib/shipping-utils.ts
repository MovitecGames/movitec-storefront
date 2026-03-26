function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function readWeightFromMetadata(metadata: Record<string, any> = {}) {
  return (
    toNumber(metadata.weight_g) ||
    toNumber(metadata.weight_grams) ||
    toNumber(metadata.weight) ||
    0
  )
}

function readLengthFromMetadata(metadata: Record<string, any> = {}) {
  return (
    toNumber(metadata.length_cm) ||
    toNumber(metadata.length) ||
    0
  )
}

function readWidthFromMetadata(metadata: Record<string, any> = {}) {
  return (
    toNumber(metadata.width_cm) ||
    toNumber(metadata.width) ||
    0
  )
}

function readHeightFromMetadata(metadata: Record<string, any> = {}) {
  return (
    toNumber(metadata.height_cm) ||
    toNumber(metadata.height) ||
    0
  )
}

export function calculateCartPhysicalSummary(items: any[]) {
  let totalWeightGrams = 0
  let totalVolumeCm3 = 0

  for (const item of items) {
    const quantity = item.quantity || 1
    const metadata = item.variant?.metadata || {}

    const weight = readWeightFromMetadata(metadata)
    const length = readLengthFromMetadata(metadata)
    const width = readWidthFromMetadata(metadata)
    const height = readHeightFromMetadata(metadata)

    totalWeightGrams += weight * quantity

    const volume = length * width * height
    totalVolumeCm3 += volume * quantity
  }

  return {
    totalWeightKg: totalWeightGrams / 1000,
    totalWeightGrams,
    totalVolumeCm3,
  }
}