export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton h-10 w-72 rounded-2xl" />
      <div className="skeleton mt-3 h-5 w-96 max-w-full rounded-xl" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden p-2.5">
            <div className="skeleton aspect-[16/10] rounded-[1.25rem]" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-4 w-24 rounded-lg" />
              <div className="skeleton h-5 w-full rounded-lg" />
              <div className="skeleton h-4 w-2/3 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
