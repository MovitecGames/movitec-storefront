type EnviaAddress = { 
   name: string 
   company: string 
   email: string 
   phone: string 
   street: string 
   number?: string 
   district?: string 
   city: string 
   state: string 
   country: string 
   postalCode: string 
} 

type EnviaPackage = { 
   content: string 
   amount: number 
   type: string 
   dimensions: { 
     length: number 
     width: number
     height: number 
   } 
   weight: number
   insurance?: number
   declaredValue?: number 
} 

type EnviaRateRequest = { 
  origin: EnviaAddress 
  destination: EnviaAddress 
  packages: EnviaPackage[]
  carrier?: string 
} 

export async function quoteEnviaShipment(payload: EnviaRateRequest) {
  const baseUrl = process.env.ENVIA_BASE_URL || "https://api.envia.com"
  const token = process.env.ENVIA_API_TOKEN

  if (!token) { 
    throw new Error("ENVIA_API_TOKEN no está configurado")
  }

  const response = await fetch(`${baseUrl}/ship/rate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
   },
   body: JSON.stringify(payload), 
   cache: "no-store",
 })

 const data = await response.json().catch(() => null)
 if (!response.ok) {
   throw new Error(
     data?.message ||
       data?.error ||
       data?.meta ||
       "No fue posible cotizar con Envia"
   )
  }
 return data 
}

export function buildEnviaOrigin() {
  return { name: process.env.ENVIA_ORIGIN_NAME || "Movitec Games",
  company: process.env.ENVIA_ORIGIN_COMPANY || "Comercializadora AETOS SAS",
  email: process.env.ENVIA_ORIGIN_EMAIL || "ventas@movitecgames.com",
  phone: process.env.ENVIA_ORIGIN_PHONE || "3246209999",
  street: process.env.ENVIA_ORIGIN_STREET || "Calle 64 # 11-37",
  city: process.env.ENVIA_ORIGIN_CITY || "11001", 
  state: process.env.ENVIA_ORIGIN_STATE || "BOGOTA D.C.",
  country: process.env.ENVIA_ORIGIN_COUNTRY || "CO",
  postalCode: process.env.ENVIA_ORIGIN_POSTAL_CODE || "11001", 
 } 
}