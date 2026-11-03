export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <div className="skeleton h-6 w-64 rounded-xl" />
      <div className="skeleton mt-4 aspect-video w-full rounded-[1.5rem]" />
      <div className="skeleton mt-6 h-8 w-2/3 rounded-xl" />
    </div>
  );
}
