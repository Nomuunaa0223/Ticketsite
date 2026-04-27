import Link from "next/link";

export async function SiteHeader() {
  return (
    <header className="z-40 bg-[linear-gradient(180deg,rgba(6,8,14,0.95),rgba(6,8,14,0.55),transparent)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 bg-[linear-gradient(180deg,rgba(10,14,25,0.98),rgba(9,12,22,0.9))] px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center text-[#ff7224]">
            <span className="text-xl font-bold uppercase tracking-[0.08em] sm:text-[1.55rem]">TIXORA</span>
          </Link>

          <nav className="flex items-center text-sm text-white/82">
            <Link href="/login" className="header-join-btn">
              Join Now
            </Link>
          </nav>
      </div>
    </header>
  );
}
