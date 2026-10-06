import type { ReactNode } from "react";
export function SellerLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="font-bold text-teal-800">
          Dukapambe
        </a>
        <h1 className="my-6 text-3xl font-bold">{title}</h1>
        <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
export const sellerButton =
  "rounded-md bg-teal-800 px-4 py-2 font-semibold text-white disabled:opacity-50";
