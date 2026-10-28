export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#D1486B]" />
    </div>
  );
}
