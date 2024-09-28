export function Showcase({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center justify-center rounded-xl border border-dashed p-8">
      {children}
    </div>
  );
}
