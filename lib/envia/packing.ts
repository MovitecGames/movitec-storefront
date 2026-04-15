import {
  type BoxCode,
  type ShippingBox,
  SHIPPING_BOXES,
  getBoxOuterDimensions,
  getBoxUsableVolume,
} from "./boxes"

export type PackingItemInput = {
  sku: string
  name?: string
  quantity: number
  weight_g: number
  length_cm: number
  width_cm: number
  height_cm: number
  unit_price: number
  can_rotate?: boolean
  ships_alone?: boolean
}

export type ExpandedPackingItem = {
  sku: string
  name?: string
  weight_g: number
  length_cm: number
  width_cm: number
  height_cm: number
  unit_price: number
  can_rotate: boolean
  ships_alone: boolean
  volume_cm3: number
}

export type PackedItemSummary = {
  sku: string
  qty: number
}

export type PackedPackage = {
  box_code: BoxCode
  outer_dimensions_cm: {
    length: number
    width: number
    height: number
  }
  weight_g: number
  declared_value: number
  items: PackedItemSummary[]
  used_volume_cm3: number
  usable_volume_cm3: number
  occupancy_ratio: number
}

export type PackingSummary = {
  total_weight_g: number
  total_declared_value: number
  boxes_used: number
}

export type PackingResult = {
  packages: PackedPackage[]
  packing_summary: PackingSummary
}

export type EnviaPackage = {
  type: "box"
  content: string
  amount: number
  declaredValue: number
  weight: number
  weightUnit: "KG"
  lengthUnit: "CM"
  dimensions: {
    length: number
    width: number
    height: number
  }
}

type WorkingBox = {
  box: ShippingBox
  items: ExpandedPackingItem[]
  used_volume_cm3: number
  declared_value: number
  weight_g: number
}

function getItemVolume(item: {
  length_cm: number
  width_cm: number
  height_cm: number
}) {
  return item.length_cm * item.width_cm * item.height_cm
}

function expandItems(items: PackingItemInput[]): ExpandedPackingItem[] {
  const expanded: ExpandedPackingItem[] = []

  for (const item of items) {
    for (let i = 0; i < item.quantity; i += 1) {
      expanded.push({
        sku: item.sku,
        name: item.name,
        weight_g: item.weight_g,
        length_cm: item.length_cm,
        width_cm: item.width_cm,
        height_cm: item.height_cm,
        unit_price: item.unit_price,
        can_rotate: item.can_rotate ?? true,
        ships_alone: item.ships_alone ?? false,
        volume_cm3: getItemVolume(item),
      })
    }
  }

  return expanded
}

function sortExpandedItems(items: ExpandedPackingItem[]) {
  return [...items].sort((a, b) => {
    if (a.ships_alone !== b.ships_alone) {
      return a.ships_alone ? -1 : 1
    }

    if (b.volume_cm3 !== a.volume_cm3) {
      return b.volume_cm3 - a.volume_cm3
    }

    const aMaxSide = Math.max(a.length_cm, a.width_cm, a.height_cm)
    const bMaxSide = Math.max(b.length_cm, b.width_cm, b.height_cm)

    if (bMaxSide !== aMaxSide) {
      return bMaxSide - aMaxSide
    }

    return b.weight_g - a.weight_g
  })
}

function getOrientations(item: ExpandedPackingItem) {
  if (!item.can_rotate) {
    return [
      {
        length: item.length_cm,
        width: item.width_cm,
        height: item.height_cm,
      },
    ]
  }

  const dims = [item.length_cm, item.width_cm, item.height_cm]

  const permutations = [
    [dims[0], dims[1], dims[2]],
    [dims[0], dims[2], dims[1]],
    [dims[1], dims[0], dims[2]],
    [dims[1], dims[2], dims[0]],
    [dims[2], dims[0], dims[1]],
    [dims[2], dims[1], dims[0]],
  ]

  const unique = new Map<string, { length: number; width: number; height: number }>()

  for (const [l, w, h] of permutations) {
    const key = `${l}-${w}-${h}`
    if (!unique.has(key)) {
      unique.set(key, { length: l, width: w, height: h })
    }
  }

  return Array.from(unique.values())
}

function itemFitsInEmptyBox(item: ExpandedPackingItem, box: ShippingBox): boolean {
  const orientations = getOrientations(item)

  return orientations.some(
    (o) =>
      o.length <= box.inner_length_cm &&
      o.width <= box.inner_width_cm &&
      o.height <= box.inner_height_cm
  )
}

function itemFitsWorkingBox(item: ExpandedPackingItem, workingBox: WorkingBox): boolean {
  if (!itemFitsInEmptyBox(item, workingBox.box)) {
    return false
  }

  const usableVolume = getBoxUsableVolume(workingBox.box)
  const nextVolume = workingBox.used_volume_cm3 + item.volume_cm3

  return nextVolume <= usableVolume
}

function createWorkingBox(box: ShippingBox): WorkingBox {
  return {
    box,
    items: [],
    used_volume_cm3: 0,
    declared_value: 0,
    weight_g: 0,
  }
}

function addItemToWorkingBox(item: ExpandedPackingItem, workingBox: WorkingBox) {
  workingBox.items.push(item)
  workingBox.used_volume_cm3 += item.volume_cm3
  workingBox.declared_value += item.unit_price
  workingBox.weight_g += item.weight_g
}

function openSmallestPossibleBox(item: ExpandedPackingItem): WorkingBox {
  const candidate = SHIPPING_BOXES.find((box) => itemFitsInEmptyBox(item, box))

  if (!candidate) {
    throw new Error(`El producto ${item.sku} no cabe en ninguna caja configurada`)
  }

  const box = createWorkingBox(candidate)
  addItemToWorkingBox(item, box)
  return box
}

function summarizeItems(items: ExpandedPackingItem[]): PackedItemSummary[] {
  const map = new Map<string, PackedItemSummary>()

  for (const item of items) {
    const existing = map.get(item.sku)

    if (existing) {
      existing.qty += 1
    } else {
      map.set(item.sku, { sku: item.sku, qty: 1 })
    }
  }

  return Array.from(map.values())
}

function workingBoxToPackage(box: WorkingBox): PackedPackage {
  const usableVolume = getBoxUsableVolume(box.box)
  const occupancyRatio = usableVolume > 0 ? box.used_volume_cm3 / usableVolume : 0

  return {
    box_code: box.box.code,
    outer_dimensions_cm: getBoxOuterDimensions(box.box),
    weight_g: box.weight_g,
    declared_value: box.declared_value,
    items: summarizeItems(box.items),
    used_volume_cm3: box.used_volume_cm3,
    usable_volume_cm3: usableVolume,
    occupancy_ratio: Number(occupancyRatio.toFixed(4)),
  }
}

function gramsToKg(value: number) {
  return Math.max(0.1, Number((value / 1000).toFixed(2)))
}

export function packOrder(items: PackingItemInput[]): PackingResult {
  if (!items.length) {
    return {
      packages: [],
      packing_summary: {
        total_weight_g: 0,
        total_declared_value: 0,
        boxes_used: 0,
      },
    }
  }

  const expanded = sortExpandedItems(expandItems(items))
  const workingBoxes: WorkingBox[] = []

  for (const item of expanded) {
    if (item.ships_alone) {
      workingBoxes.push(openSmallestPossibleBox(item))
      continue
    }

    const sortedBoxes = [...workingBoxes].sort((a, b) => {
      const aRemaining = getBoxUsableVolume(a.box) - a.used_volume_cm3
      const bRemaining = getBoxUsableVolume(b.box) - b.used_volume_cm3
      return aRemaining - bRemaining
    })

    let inserted = false

    for (const box of sortedBoxes) {
      if (itemFitsWorkingBox(item, box)) {
        addItemToWorkingBox(item, box)
        inserted = true
        break
      }
    }

    if (!inserted) {
      workingBoxes.push(openSmallestPossibleBox(item))
    }
  }

  const packages = workingBoxes.map(workingBoxToPackage)

  return {
    packages,
    packing_summary: {
      total_weight_g: packages.reduce((sum, p) => sum + p.weight_g, 0),
      total_declared_value: packages.reduce((sum, p) => sum + p.declared_value, 0),
      boxes_used: packages.length,
    },
  }
}

export function packingResultToEnviaPackages(result: PackingResult): EnviaPackage[] {
  return result.packages.map((pkg) => ({
    type: "box",
    content:
      pkg.items.map((item) => item.sku).slice(0, 3).join(", ") || "Juegos de mesa",
    amount: 1,
    declaredValue: pkg.declared_value,
    weight: gramsToKg(pkg.weight_g),
    weightUnit: "KG",
    lengthUnit: "CM",
    dimensions: {
      length: pkg.outer_dimensions_cm.length,
      width: pkg.outer_dimensions_cm.width,
      height: pkg.outer_dimensions_cm.height,
    },
  }))
}