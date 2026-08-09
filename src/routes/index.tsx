import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Baby,
  Check,
  Footprints,
  Gem,
  Handbag,
  Languages,
  MapPin,
  MessageCircle,
  Search,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { FormEvent } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Category = {
  name: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

type ProductPreview = {
  title: string;
  price: string;
  location: string;
  category: string;
  icon: LucideIcon;
  gradient: string;
};

const categories: Category[] = [
  {
    name: "Nguo za Wanawake",
    description: "Abaya, hijabu na mavazi",
    icon: Shirt,
    tone: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  {
    name: "Viatu vya Wanawake",
    description: "Viatu kwa kila mtindo",
    icon: Footprints,
    tone: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    name: "Mikoba",
    description: "Mikoba ya kila siku na hafla",
    icon: Handbag,
    tone: "bg-orange-50 text-orange-700 ring-orange-100",
  },
  {
    name: "Manukato",
    description: "Harufu nzuri unazopenda",
    icon: Sparkles,
    tone: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  {
    name: "Vito na Vifaa vya Mitindo",
    description: "Vito na mapambo ya mtindo",
    icon: Gem,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  },
  {
    name: "Kids Corner",
    description: "Mitindo na mahitaji ya watoto",
    icon: Baby,
    tone: "bg-teal-50 text-teal-700 ring-teal-100",
  },
];

const products: ProductPreview[] = [
  {
    title: "Abaya ya Kisasa",
    price: "KES 3,500",
    location: "Mvita, Mombasa",
    category: "Nguo za Wanawake",
    icon: Shirt,
    gradient: "from-teal-100 via-cyan-50 to-rose-100",
  },
  {
    title: "Mkoba wa Wanawake",
    price: "KES 2,800",
    location: "Diani, Kwale",
    category: "Mikoba",
    icon: Handbag,
    gradient: "from-orange-100 via-amber-50 to-rose-100",
  },
  {
    title: "Manukato ya Kupendeza",
    price: "KES 1,950",
    location: "Nyali, Mombasa",
    category: "Manukato",
    icon: Sparkles,
    gradient: "from-violet-100 via-fuchsia-50 to-cyan-50",
  },
  {
    title: "Viatu vya Mtindo",
    price: "KES 2,400",
    location: "Malindi, Kilifi",
    category: "Viatu vya Wanawake",
    icon: Footprints,
    gradient: "from-amber-100 via-orange-50 to-teal-50",
  },
  {
    title: "Seti ya Vito",
    price: "KES 1,600",
    location: "Bamburi, Mombasa",
    category: "Vito na Vifaa",
    icon: Gem,
    gradient: "from-cyan-100 via-sky-50 to-violet-100",
  },
  {
    title: "Nguo za Watoto",
    price: "KES 1,200",
    location: "Kilifi Town, Kilifi",
    category: "Kids Corner",
    icon: Baby,
    gradient: "from-teal-100 via-emerald-50 to-amber-50",
  },
];

const trustPoints = [
  { title: "Tafuta kwa urahisi", detail: "Anza na bidhaa unayotaka.", icon: Search },
  {
    title: "Chuja unavyopenda",
    detail: "Tumia kategoria na eneo baada ya kuanza.",
    icon: SlidersHorizontal,
  },
  {
    title: "Zungumza na muuzaji",
    detail: "Uliza kuhusu bidhaa baada ya kuingia.",
    icon: MessageCircle,
  },
  {
    title: "Kiswahili kwanza",
    detail: "Maneno mepesi kwa matumizi rahisi.",
    icon: Languages,
  },
];

function Index() {
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.querySelector("#bidhaa")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900">
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-cyan-50 via-teal-50/80 to-white">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_15%_5%,rgba(94,234,212,0.22),transparent_38%),radial-gradient(circle_at_88%_18%,rgba(125,211,252,0.22),transparent_34%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -top-32 right-[8%] -z-10 h-96 w-96 rounded-full border border-white/70 bg-white/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-[-12%] bottom-10 -z-10 h-40 rounded-[50%] border-t border-teal-200/50 bg-white/25 blur-sm"
        />

        <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <a
            href="/"
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="Dukapambe mwanzo"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm shadow-teal-900/10 transition-transform group-hover:-translate-y-0.5">
              <Waves className="size-5" aria-hidden="true" />
            </span>
            <span className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Dukapambe
            </span>
          </a>

          <nav className="flex shrink-0 items-center gap-2" aria-label="Urambazaji mkuu">
            <a
              href="#tafuta"
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white/70 sm:inline-flex"
            >
              <Search className="size-4" aria-hidden="true" />
              Tafuta
            </a>
            <a
              href="/login"
              className="rounded-full border border-teal-800/15 bg-white/75 px-3.5 py-2 text-sm font-semibold text-teal-900 shadow-sm backdrop-blur transition-colors hover:bg-white sm:px-4"
            >
              Ingia
            </a>
            <a
              href="/login"
              className="rounded-full bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-950/10 transition-colors hover:bg-teal-800 sm:px-4"
            >
              <span className="sm:hidden">Uza Bidhaa</span>
              <span className="hidden sm:inline">Uza Bidhaa Yako</span>
            </a>
          </nav>
        </header>

        <div className="mx-auto max-w-5xl px-4 pb-24 pt-14 text-center sm:px-6 sm:pb-32 sm:pt-20 lg:pt-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-700/10 bg-white/65 px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-900 shadow-sm backdrop-blur sm:text-sm">
            <MapPin className="size-4 text-rose-500" aria-hidden="true" />
            Mombasa Â· Kwale Â· Kilifi
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            Soko la Mitindo kwa Pwani ya Kenya
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Tafuta nguo, viatu, mikoba, manukato, vito na bidhaa za watoto kutoka wauzaji wa
            Mombasa, Kwale na Kilifi.
          </p>

          <form
            id="tafuta"
            onSubmit={handleSearch}
            className="mx-auto mt-9 flex max-w-3xl flex-col gap-2 rounded-[1.4rem] border border-white/90 bg-white p-2.5 text-left shadow-[0_20px_65px_-28px_rgba(13,116,116,0.38)] sm:flex-row sm:rounded-full"
          >
            <label htmlFor="hero-search" className="sr-only">
              Tafuta bidhaa, kategoria au eneo
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 sm:py-0">
              <Search className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="Tafuta bidhaa, kategoria au eneo"
                className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-700 px-6 text-sm font-bold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:rounded-full"
            >
              Tafuta Bidhaa
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Check className="size-4 text-teal-700" aria-hidden="true" />
              Tazama bila akaunti
            </span>
            <a
              href="/login"
              className="font-semibold text-teal-800 underline-offset-4 hover:underline"
            >
              Uza Bidhaa Yako
            </a>
          </div>
        </div>
      </section>

      <main>
        <section id="kategoria" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading
            eyebrow="Gundua kwa kategoria"
            title="Anza na unachotafuta"
            description="Kategoria sita zilizochaguliwa kwa soko la kwanza la Dukapambe."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/70">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-16">
            <div>
              <span className="text-sm font-bold tracking-wide text-teal-700">
                Nunua kwa eneo lako
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Pwani nzima, utafutaji mmoja
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Nunua kwa urahisi kutoka Mombasa, Kwale na Kilifi. Unaweza kutafuta kwanza kisha
                kuchuja kwa eneo.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {["Mombasa", "Kwale", "Kilifi"].map((county) => (
                <a
                  key={county}
                  href="#bidhaa"
                  className="group flex min-h-24 flex-col items-center justify-center rounded-2xl border border-teal-900/10 bg-white px-2 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-700/30 hover:shadow-md"
                >
                  <MapPin className="size-5 text-rose-500" aria-hidden="true" />
                  <span className="mt-2 text-sm font-bold text-slate-800 sm:text-base">
                    {county}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="bidhaa" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading
            eyebrow="Bidhaa za kuanzia"
            title="Gundua kinachopatikana Pwani"
            description="Mifano ya muonekano wa bidhaa. Orodha halisi itaunganishwa katika hatua inayofuata."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.title} product={product} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-teal-900/10 bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 px-6 py-10 text-white shadow-[0_24px_70px_-35px_rgba(15,118,110,0.8)] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-teal-100">
                <ShoppingBag className="size-4" aria-hidden="true" />
                Kwa wauzaji wa Pwani
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Una bidhaa za kuuza?
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-teal-50/90">
                Fungua akaunti ya muuzaji na uanze kuonyesha bidhaa zako kwa wanunuzi wa Pwani.
              </p>
            </div>
            <a
              href="/login"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-teal-900 shadow-sm transition-transform hover:-translate-y-0.5 lg:mt-0"
            >
              Uza Bidhaa Yako
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="bg-rose-50/45">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHeading
              eyebrow="Dukapambe ni rahisi"
              title="Soko la karibu, bila usumbufu"
              description="Tafuta, linganisha na uwasiliane kwa hatua zilizo wazi."
              centered
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="rounded-2xl border border-rose-900/5 bg-white p-5 shadow-sm"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-bold text-slate-900">{point.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{point.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_0.6fr_0.6fr] lg:px-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-teal-700 text-white">
                <Waves className="size-4" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold tracking-tight">Dukapambe</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Soko la Kiswahili la mitindo, manukato, vito na bidhaa za watoto kwa Pwani ya Kenya.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Gundua</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <a href="#tafuta" className="hover:text-teal-700">
                Tafuta
              </a>
              <a href="#kategoria" className="hover:text-teal-700">
                Kategoria
              </a>
              <a href="#bidhaa" className="hover:text-teal-700">
                Bidhaa
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Kaunti za uzinduzi</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Mombasa Â· Kwale Â· Kilifi</p>
            <a
              href="/login"
              className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Ingia
            </a>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-5 text-center text-xs text-slate-500">
          Â© 2026 Dukapambe Â· Kiswahili kwanza kwa Pwani ya Kenya
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="text-sm font-bold tracking-wide text-teal-700">{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon;
  return (
    <a
      href="#bidhaa"
      className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-700/25 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${category.tone}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-900">{category.name}</span>
        <span className="mt-1 block text-sm text-slate-500">{category.description}</span>
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-teal-700"
        aria-hidden="true"
      />
    </a>
  );
}

function ProductCard({ product }: { product: ProductPreview }) {
  const Icon = product.icon;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
      <div
        className={`relative aspect-[4/5] overflow-hidden bg-gradient-to-br ${product.gradient}`}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-8 size-36 rounded-full bg-white/35 blur-xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-8 -left-8 size-28 rounded-full border border-white/50 bg-white/20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-20 items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/55 text-slate-700 shadow-sm backdrop-blur-sm transition-transform group-hover:scale-105">
            <Icon className="size-9" aria-hidden="true" />
          </span>
        </div>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-teal-800 shadow-sm backdrop-blur">
          <Check className="size-3" aria-hidden="true" />
          Inapatikana
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-teal-700">{product.category}</p>
        <h3 className="mt-1 line-clamp-2 font-bold leading-snug text-slate-900">{product.title}</h3>
        <p className="mt-2 text-lg font-extrabold tracking-tight text-slate-950">{product.price}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
          <MapPin className="size-3.5 shrink-0 text-rose-500" aria-hidden="true" />
          <span className="truncate">{product.location}</span>
        </p>
      </div>
    </article>
  );
}

