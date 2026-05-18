export default function Home() {
  return (
    <main className="evo-wrap pt-12 sm:pt-16">
      <header className="flex items-center justify-between gap-6">
        <div className="text-[13px] font-semibold tracking-tight text-black/80">
          EvolveOne Calendar
        </div>
        <div className="text-[13px] text-black/55">White-label scheduling</div>
      </header>

      <section className="mt-10 rounded-2xl border border-black/10 bg-white/80 backdrop-blur-md shadow-[0_18px_55px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-10 sm:px-10 sm:py-14">
          <p className="text-[12px] uppercase tracking-[0.12em] text-black/55">
            SaaS scheduling platform
          </p>
          <h1 className="mt-3 text-[clamp(32px,5vw,54px)] leading-[1.04] tracking-[-0.03em] font-semibold text-[#111]">
            Bookings, simplified.
          </h1>
          <p className="mt-4 max-w-[62ch] text-[15px] leading-[1.7] text-black/60">
            Create a workspace, set availability, and share a booking link that feels
            like it was built for your brand.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#0071e3] px-6 text-[15px] font-semibold text-white shadow-[0_16px_34px_rgba(0,113,227,0.18)] transition hover:translate-y-[-1px] hover:bg-[#0066cc]"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full border border-black/15 bg-white px-6 text-[15px] font-semibold text-[#111] transition hover:bg-black/[0.03]"
            >
              Create an account
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
