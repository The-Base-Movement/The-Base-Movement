export function RelatedProducts() {
  return (
    <section className="mt-24">
      <h2 className="font-h2 text-h3 text-stone-900 mb-12">You might also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-[4/5] bg-stone-100 rounded-sm animate-pulse" />
        ))}
      </div>
    </section>
  )
}
