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
  PackageSearch,
  Search,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Category = {
  name: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

type Product = {
  id: number;
  title: string;
  price: number;
  county: "Mombasa" | "Kwale" | "Kilifi";
  location: string;
  category: string;
  description: string;
  image: string;
  imagePosition?: string;
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

const products: Product[] = [
  {
    id: 1,
    title: "Abaya ya Bahari Premium",
    price: 3500,
    county: "Mombasa",
    location: "Mvita, Mombasa",
    category: "Nguo za Wanawake",
    description: "Abaya nyepesi yenye mshono wa kisasa, bora kwa hafla na matumizi ya kila siku.",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=82",
    imagePosition: "center 24%",
  },
  {
    id: 2,
    title: "Mkoba wa Ngozi Diani",
    price: 2800,
    county: "Kwale",
    location: "Diani, Kwale",
    category: "Mikoba",
    description: "Mkoba maridadi wenye nafasi nzuri na umaliziaji wa kifahari kwa kila siku.",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: 3,
    title: "Manukato ya Zahari",
    price: 1950,
    county: "Mombasa",
    location: "Nyali, Mombasa",
    category: "Manukato",
    description: "Harufu tulivu ya maua na viungo vya pwani inayodumu muda mrefu.",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: 4,
    title: "Viatu vya Kisasa Malindi",
    price: 2400,
    county: "Kilifi",
    location: "Malindi, Kilifi",
    category: "Viatu vya Wanawake",
    description: "Viatu vya kuvutia vilivyotengenezwa kwa starehe kuanzia asubuhi hadi jioni.",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: 5,
    title: "Seti ya Vito vya Pwani",
    price: 1600,
    county: "Mombasa",
    location: "Bamburi, Mombasa",
    category: "Vito na Vifaa vya Mitindo",
    description: "Seti maridadi ya vito kwa zawadi, sherehe na mwonekano wa kila siku.",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: 6,
    title: "Mavazi ya Watoto Kilifi",
    price: 1200,
    county: "Kilifi",
    location: "Kilifi Town, Kilifi",
    category: "Kids Corner",
    description: "Mavazi laini, yenye rangi nzuri na starehe kwa watoto wanaopenda kucheza.",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=82",
    imagePosition: "center 28%",
  },
];

const counties = ["Mombasa", "Kwale", "Kilifi"] as const;

const trustPoints = [
  { title: "Tafuta kwa urahisi", detail: "Pata bidhaa nzuri bila usumbufu.", icon: Search },
  {
    title: "Chuja unavyopenda",
    detail: "Chagua kategoria na kaunti papo hapo.",
    icon: SlidersHorizontal,
  },
  {
    title: "Zungumza na muuzaji",
    detail: "Uliza kuhusu bidhaa baada ya kuingia.",
    icon: MessageCircle,
  },
  {
    title: "Kiswahili kwanza",
    detail: "Soko rahisi kwa jamii za Pwani.",
    icon: Languages,
  },
];

function Index() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!openProduct) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenProduct(null);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openProduct]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [product.title, product.category, product.county, product.location, product.description]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = selectedCategory === null || product.category === selectedCategory;
      const matchesCounty = selectedCounty === null || product.county === selectedCounty;

      return matchesQuery && matchesCategory && matchesCounty;
    });
  }, [query, selectedCategory, selectedCounty]);

  const hasActiveFilters = Boolean(query.trim() || selectedCategory || selectedCounty);

  function clearFilters() {
    setQuery("");
    setSelectedCategory(null);
    setSelectedCounty(null);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.querySelector("#bidhaa")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-900">
      {!openProduct && <FloatingBackground />}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#062d35]/88 shadow-[0_12px_40px_-20px_rgba(2,20,26,0.85)] backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-2 px-3 sm:h-20 sm:px-6 lg:px-8">
          <a
            href="/"
            className="group flex min-w-0 items-center gap-2 sm:gap-2.5"
            aria-label="Dukapambe mwanzo"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-teal-100 shadow-inner sm:size-11 sm:rounded-2xl">
              <Waves className="size-5" aria-hidden="true" />
            </span>
            <span className="text-[1.05rem] font-extrabold tracking-[-0.03em] text-white sm:text-2xl">
              Dukapambe
            </span>
          </a>

          <nav
            className="flex shrink-0 items-center gap-1.5 sm:gap-2.5"
            aria-label="Urambazaji mkuu"
          >
            <a
              href="/login"
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 text-xs font-bold text-white transition-all hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-10 sm:px-5 sm:text-sm"
            >
              Ingia
            </a>
            <a
              href="/login"
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#f2b86b] px-3 text-xs font-extrabold text-[#17343a] shadow-[0_8px_24px_-10px_rgba(242,184,107,0.8)] transition-all hover:-translate-y-0.5 hover:bg-[#ffd08d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2b86b] active:scale-[0.98] sm:min-h-10 sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">Uza Bidhaa</span>
              <span className="hidden sm:inline">Uza Bidhaa Yako</span>
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate flex min-h-[46rem] items-center overflow-hidden bg-[#06333c] pt-[4.5rem] text-white sm:min-h-[48rem] sm:pt-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=85)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(3,38,47,0.92)_0%,rgba(3,49,59,0.76)_48%,rgba(6,64,72,0.45)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_18%,rgba(255,205,139,0.48),transparent_25%),linear-gradient(to_top,rgba(4,37,44,0.85),transparent_48%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[42%] -z-10 h-px bg-gradient-to-r from-transparent via-amber-100/50 to-transparent"
        />
        <CoastalBoats />

        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold tracking-[0.12em] text-teal-50 shadow-sm backdrop-blur-md sm:text-sm">
              <MapPin className="size-4 text-[#ffd08d]" aria-hidden="true" />
              MOMBASA · KWALE · KILIFI
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
              Soko la Mitindo la Pwani ya Kenya
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-white/82 sm:text-xl sm:leading-8">
              Gundua mitindo iliyochaguliwa kutoka kwa wauzaji wa Mombasa, Kwale na Kilifi — mahali
              ambapo ubunifu wa Pwani hukutana na urahisi wa kisasa.
            </p>

            <form
              id="tafuta"
              onSubmit={handleSearch}
              className="mt-9 max-w-3xl rounded-[1.6rem] border border-white/40 bg-white/92 p-2.5 text-left shadow-[0_28px_80px_-25px_rgba(1,25,31,0.85)] backdrop-blur-xl sm:flex sm:items-center sm:rounded-full sm:p-2"
            >
              <label htmlFor="hero-search" className="sr-only">
                Tafuta kwa bidhaa, kategoria, kaunti au maelezo
              </label>
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 sm:px-4 sm:py-0">
                <Search className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tafuta bidhaa, kategoria au kaunti..."
                  className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Futa utafutaji"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-teal-800 px-6 text-sm font-extrabold text-white shadow-md transition-all hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.985] sm:w-auto sm:rounded-full"
              >
                Tafuta Bidhaa
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/75">
              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-[#ffd08d]" aria-hidden="true" />
                Matokeo hubadilika unapoandika
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-[#ffd08d]" aria-hidden="true" />
                Tazama bila akaunti
              </span>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section
          id="kategoria"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
        >
          <SectionHeading
            eyebrow="Gundua kwa kategoria"
            title="Mitindo ya Pwani, kwa namna yako"
            description="Chagua kategoria ili kuona bidhaa husika. Gusa tena kuondoa chaguo."
          />
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.name}
                category={category}
                selected={selectedCategory === category.name}
                onSelect={() =>
                  setSelectedCategory((current) =>
                    current === category.name ? null : category.name,
                  )
                }
              />
            ))}
          </div>
        </section>

        <section className="border-y border-teal-950/8 bg-[#eef7f4]">
          <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
            <div>
              <span className="text-sm font-extrabold tracking-[0.08em] text-teal-700">
                NUNUA KWA ENEO LAKO
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[#092f35] sm:text-4xl">
                Pwani nzima, utafutaji mmoja
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Chagua kaunti na uone mitindo inayopatikana karibu nawe. Gusa kaunti hiyo tena
                kurudi kwenye matokeo yote.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {counties.map((county) => {
                const selected = selectedCounty === county;
                return (
                  <button
                    key={county}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setSelectedCounty((current) => (current === county ? null : county))
                    }
                    className={`group flex min-h-28 flex-col items-center justify-center rounded-2xl border px-2 text-center shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.97] sm:min-h-32 ${
                      selected
                        ? "border-teal-800 bg-teal-800 text-white shadow-lg shadow-teal-950/15"
                        : "border-teal-900/10 bg-white text-slate-800 hover:-translate-y-1 hover:border-teal-700/30 hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`flex size-9 items-center justify-center rounded-full ${
                        selected ? "bg-white/14 text-[#ffd08d]" : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      <MapPin className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="mt-2.5 text-sm font-extrabold sm:text-base">{county}</span>
                    {selected && (
                      <span className="mt-1 text-[10px] font-bold text-teal-100">Imechaguliwa</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="bidhaa"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Bidhaa zilizochaguliwa"
              title={hasActiveFilters ? "Matokeo yako" : "Gundua kinachopatikana Pwani"}
              description={`${filteredProducts.length} ${
                filteredProducts.length === 1 ? "bidhaa imepatikana" : "bidhaa zimepatikana"
              }.`}
            />
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-teal-800/20 bg-white px-5 text-sm font-extrabold text-teal-800 shadow-sm transition-all hover:border-teal-800/40 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto"
            >
              <X className="size-4" aria-hidden="true" />
              Clear Filters
            </button>
          </div>

          {hasActiveFilters && (
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Vichujio vilivyochaguliwa">
              {query.trim() && <FilterPill label={`Utafutaji: ${query.trim()}`} />}
              {selectedCategory && <FilterPill label={selectedCategory} />}
              {selectedCounty && <FilterPill label={selectedCounty} />}
            </div>
          )}

          {filteredProducts.length > 0 ? (
            <div className="mt-9 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenImage={() => setOpenProduct(product)}
                />
              ))}
            </div>
          ) : (
            <EmptyState onReset={clearFilters} />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#063e47] via-teal-800 to-[#157f84] px-6 py-10 text-white shadow-[0_30px_80px_-40px_rgba(7,74,82,0.95)] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-32 -z-10 size-80 rounded-full border border-white/10 bg-white/5"
            />
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#ffd08d]">
                <ShoppingBag className="size-4" aria-hidden="true" />
                Kwa wauzaji wa Pwani
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
                Una bidhaa za kuuza?
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-teal-50/85">
                Fungua akaunti ya muuzaji na uonyeshe bidhaa zako kwa wanunuzi wa Pwani.
              </p>
            </div>
            <a
              href="/login"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-teal-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] lg:mt-0"
            >
              Uza Bidhaa Yako
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="bg-[#f7ece6]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
            <SectionHeading
              eyebrow="Dukapambe ni rahisi"
              title="Soko la karibu, bila usumbufu"
              description="Tafuta, chuja na uwasiliane kwa hatua zilizo wazi."
              centered
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="rounded-2xl border border-rose-900/6 bg-white/85 p-5 shadow-sm backdrop-blur"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-extrabold text-slate-900">{point.title}</h3>
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
              <span className="flex size-9 items-center justify-center rounded-xl bg-teal-800 text-white">
                <Waves className="size-4" aria-hidden="true" />
              </span>
              <span className="text-xl font-extrabold tracking-tight">Dukapambe</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Soko la Kiswahili la mitindo, manukato, vito na bidhaa za watoto kwa Pwani ya Kenya.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Gundua</h2>
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
            <h2 className="text-sm font-extrabold text-slate-900">Kaunti za uzinduzi</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Mombasa, Kwale na Kilifi</p>
            <a
              href="/login"
              className="mt-3 inline-block text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              Ingia
            </a>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-5 text-center text-xs text-slate-500">
          2026 Dukapambe | Fashion Marketplace of the Kenyan Coast
        </div>
      </footer>

      {openProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={openProduct.title}
          onClick={() => setOpenProduct(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#03212a]/85 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-3xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOpenProduct(null)}
              aria-label="Funga picha"
              className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-[#062f37]/80 text-white backdrop-blur transition-colors hover:bg-[#062f37]"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <img
              src={openProduct.image}
              alt={openProduct.title}
              className="max-h-[70vh] w-full object-contain bg-slate-100"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{openProduct.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{openProduct.location}</p>
              </div>
              <p className="text-xl font-black text-[#092f35]">
                KES {openProduct.price.toLocaleString("en-KE")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FloatingBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="dp-float-a absolute -left-24 top-[18%] size-72 rounded-full bg-[radial-gradient(circle,rgba(21,127,132,0.20),transparent_70%)] blur-2xl" />
      <div className="dp-float-b absolute right-[-6rem] top-[42%] size-96 rounded-full bg-[radial-gradient(circle,rgba(242,184,107,0.22),transparent_70%)] blur-3xl" />
      <div className="dp-float-c absolute bottom-[8%] left-[35%] size-80 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.14),transparent_70%)] blur-3xl" />
    </div>
  );
}

function CoastalBoats() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        viewBox="0 0 240 90"
        className="absolute right-[14%] top-[35%] w-24 text-[#173f44]/70 opacity-80 sm:w-32 lg:w-40"
        fill="currentColor"
      >
        <path d="M49 61h145l-18 10H69L49 61Z" />
        <path d="M117 17h3v44h-3z" />
        <path d="m115 21-43 37h43V21ZM122 27l35 31h-35V27Z" opacity=".88" />
      </svg>
      <svg
        viewBox="0 0 240 90"
        className="absolute right-[2%] top-[42%] w-14 text-[#173f44]/65 opacity-65 sm:right-[5%] sm:w-20 lg:w-24"
        fill="currentColor"
      >
        <path d="M49 61h145l-18 10H69L49 61Z" />
        <path d="M117 17h3v44h-3z" />
        <path d="m115 21-43 37h43V21ZM122 27l35 31h-35V27Z" opacity=".88" />
      </svg>
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
      <span className="text-sm font-extrabold tracking-[0.08em] text-teal-700">{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-[#092f35] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function CategoryCard({
  category,
  selected,
  onSelect,
}: {
  category: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.985] ${
        selected
          ? "border-teal-800 bg-teal-800 text-white shadow-lg shadow-teal-950/15"
          : "border-slate-200/80 bg-white hover:-translate-y-1 hover:border-teal-700/25 hover:shadow-md"
      }`}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${
          selected ? "bg-white/12 text-[#ffd08d] ring-white/15" : category.tone
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-extrabold ${selected ? "text-white" : "text-slate-900"}`}>
          {category.name}
        </span>
        <span className={`mt-1 block text-sm ${selected ? "text-teal-100" : "text-slate-500"}`}>
          {selected ? "Imechaguliwa" : category.description}
        </span>
      </span>
      <ArrowRight
        className={`size-4 shrink-0 transition-transform group-hover:translate-x-1 ${
          selected ? "text-[#ffd08d]" : "text-slate-300 group-hover:text-teal-700"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function ProductCard({ product, onOpenImage }: { product: Product; onOpenImage: () => void }) {
  return (
    <article className="group relative z-10 flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-slate-200/75 bg-white shadow-[0_12px_35px_-24px_rgba(15,52,59,0.65)] transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-700/20 hover:shadow-[0_24px_55px_-26px_rgba(15,74,80,0.55)] active:scale-[0.985]">
      <button
        type="button"
        onClick={onOpenImage}
        aria-label={`Fungua picha ya ${product.title}`}
        className="relative aspect-[4/3] w-full shrink-0 cursor-zoom-in overflow-hidden bg-slate-100"
      >
        <img
          src={product.image}
          alt={product.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.045]"
          style={{ objectPosition: product.imagePosition ?? "center" }}
          loading="lazy"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/32 via-transparent to-transparent"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-teal-800 shadow-sm backdrop-blur">
          <Check className="size-3" aria-hidden="true" />
          Inapatikana
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#062f37]/82 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          <MapPin className="size-3 text-[#ffd08d]" aria-hidden="true" />
          {product.county}
        </span>
      </button>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-teal-700">
          {product.category}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-snug tracking-[-0.015em] text-slate-950">
          {product.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Bei</p>
            <p className="mt-0.5 text-xl font-black tracking-tight text-[#092f35]">
              KES {product.price.toLocaleString("en-KE")}
            </p>
          </div>
          <p className="max-w-[45%] truncate text-right text-xs font-medium text-slate-500">
            {product.location}
          </p>
        </div>
      </div>
    </article>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-800/12 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">
      <Check className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-9 flex min-h-96 flex-col items-center justify-center rounded-[2rem] border border-dashed border-teal-800/20 bg-gradient-to-b from-white to-teal-50/60 px-6 py-14 text-center">
      <span className="flex size-20 items-center justify-center rounded-[1.75rem] bg-white text-teal-700 shadow-[0_18px_45px_-20px_rgba(15,118,110,0.45)] ring-1 ring-teal-900/8">
        <PackageSearch className="size-9" aria-hidden="true" />
      </span>
      <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-[#092f35]">
        No products found
      </h3>
      <p className="mt-2 max-w-md leading-7 text-slate-600">
        Hakuna bidhaa zinazolingana na utafutaji wako. Ondoa vichujio ujaribu tena.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-teal-800 px-5 text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-teal-900 active:scale-[0.98]"
      >
        <X className="size-4" aria-hidden="true" />
        Reset Filters
      </button>
    </div>
  );
}
