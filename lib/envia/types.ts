export type BoxCode = "S" | "M" | "L"

export type BoxDefinition = {
  code: BoxCode
  label: string
  innerLengthCm: number
  innerWidthCm: number
  innerHeightCm: number
}

export type NormalizedCartItem = {
  id: string
  title: string
  quantity: number
  unitPrice: number
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
}

export type ExpandedItemUnit = {
  id: string
  title: string
  unitPrice: number
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
  volumeCm3: number
}

export type PackedBox = {
  boxCode: BoxCode
  boxLabel: string
  dimensions: {
    length: number
    width: number
    height: number
  }
  items: ExpandedItemUnit[]
  totalWeightGrams: number
  totalWeightKg: number
  declaredValue: number
  usedVolumeCm3: number
  boxVolumeCm3: number
}

export type EnviaReadyPackage = {
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

export type PackingResult = {
  packedBoxes: PackedBox[]
  packages: EnviaReadyPackage[]
  totalWeightGrams: number
  totalWeightKg: number
  declaredValue: number
}