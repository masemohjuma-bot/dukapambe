Exit code: 0
Wall time: 2.8 seconds
Output:
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-slate-900">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Ukurasa haujapatikana</h2>
        <p className="mt-2 text-sm text-slate-600">Ukurasa huu haupo au umehamishwa.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          >
            Rudi mwanzo
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Ukurasa haujafunguka
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Kuna tatizo limetokea. Tafadhali jaribu tena au urudi mwanzo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Jaribu tena
          </button>
          <a
            href="/"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Rudi mwanzo
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dukapambe | Soko la Mitindo Pwani" },
      {
        name: "description",
        content:
          "Tafuta mitindo, manukato, vito na bidhaa za watoto kutoka Mombasa, Kwale na Kilifi.",
      },
      { name: "author", content: "Dukapambe" },
      { property: "og:title", content: "Dukapambe | Soko la Mitindo Pwani" },
      {
        property: "og:description",
        content: "Soko la Kiswahili la mitindo kwa Pwani ya Kenya.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sw">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

