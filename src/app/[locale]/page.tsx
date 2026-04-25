export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🗺 K컬처MAP</h1>
      <p>Coming soon — locale: {locale}</p>
    </main>
  )
}
