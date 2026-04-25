export default async function HomePage({
  params,
}: {
  params: { locale: string }
}) {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>K컬처MAP</h1>
      <p>Coming soon — locale: {params.locale}</p>
    </main>
  )
}
