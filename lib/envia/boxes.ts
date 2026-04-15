export type BoxCode = "S" | "M" | "L"

export type ShippingBox = {
  code: BoxCode
  inner_length_cm: number
  inner_width_cm: number
  inner_height_cm: number
  outer_length_cm: number
  outer_width_cm: number
  outer_height_cm: number
}

export const SHIPPING_BOXES: ShippingBox[] = [
  {
    code: "S",
    inner_length_cm: 30,
    inner_width_cm: 24,
    inner_height_cm: 14,
    outer_length_cm: 32,
    outer_width_cm: 26,
    outer_height_cm: 16,
  },
  {
    code: "M",
    inner_length_cm: 44,
    inner_width_cm: 34,
    inner_height_cm: 20,
    outer_length_cm: 46,
    outer_width_cm: 36,
    outer_height_cm: 22,
  },
  {
    code: "L",
    inner_length_cm: 60,
    inner_width_cm: 40,
    inner_height_cm: 35,
    outer_length_cm: 62,
    outer_width_cm: 42,
    outer_height_cm: 37,
  },
]

export const BOX_USABLE_VOLUME_RATIO = 0.9

export function getBoxByCode(code: BoxCode): ShippingBox {
  const box = SHIPPING_BOXES.find((b) => b.code === code)

  if (!box) {
    throw new Error(`Box not found: ${code}`)
  }

  return box
}

export function getBoxInnerVolume(box: ShippingBox): number {
  return box.inner_length_cm * box.inner_width_cm * box.inner_height_cm
}

export function getBoxUsableVolume(box: ShippingBox): number {
  return getBoxInnerVolume(box) * BOX_USABLE_VOLUME_RATIO
}

export function getBoxOuterDimensions(box: ShippingBox) {
  return {
    length: box.outer_length_cm,
    width: box.outer_width_cm,
    height: box.outer_height_cm,
  }
}
