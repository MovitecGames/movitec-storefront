import { medusa } from "../lib/medusa"

export default async function Home() {
  const { products } = await medusa.store.product.list()

  return (
    <main style={{ padding: 20 }}>
      <h1>Movitec Games B2B</h1>

      {!products?.length && <p>No hay productos todavía.</p>}

      {products?.map((p: any) => (
        <div key={p.id}>
          <h2>{p.title}</h2>
        </div>
      ))}
    </main>
  )
}