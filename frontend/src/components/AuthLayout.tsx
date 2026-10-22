import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] lg:items-stretch lg:gap-8">
      <aside className="creative-auth-panel hidden flex-col justify-between rounded-2xl border border-line bg-brand-soft p-8 lg:flex xl:p-10">
        <p className="eyebrow">CareerNet · Your next move</p>
        <div className="max-w-xl">
          <h2 className="text-4xl xl:text-5xl">Find a path that feels like yours.</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted xl:text-lg">
            Discover your strengths, explore careers and universities, and turn your ideas into a plan.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm font-semibold">
          {["Discover", "Explore", "Plan"].map((step, index) => (
            <div key={step} className="rounded-xl border border-line bg-card/70 p-4">
              <span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">0{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </aside>
      {children}
    </div>
  );
}
