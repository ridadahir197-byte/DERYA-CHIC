import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-neon">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off the runway</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist in our collection.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-neon px-6 py-3 text-sm font-bold text-neon-foreground"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something glitched</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-[14px] bg-neon px-6 py-3 text-sm font-bold text-neon-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "DERYA Chic — Luxury Fashion" },
      { name: "description", content: "DERYA Chic. Wearable architecture. Dark luxury fashion crafted for the night." },
      { name: "theme-color", content: "#FFFFFF" },
      { property: "og:title", content: "DERYA Chic — Luxury Fashion" },
      { name: "twitter:title", content: "DERYA Chic — Luxury Fashion" },
      { property: "og:description", content: "DERYA Chic. Wearable architecture. Dark luxury fashion crafted for the night." },
      { name: "twitter:description", content: "DERYA Chic. Wearable architecture. Dark luxury fashion crafted for the night." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f7ecc8e9-1aa1-4e6f-996d-12f9480d818a/id-preview-19f47e8a--3b6613bb-955e-426a-8763-ebdf9339e94a.lovable.app-1778336044703.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f7ecc8e9-1aa1-4e6f-996d-12f9480d818a/id-preview-19f47e8a--3b6613bb-955e-426a-8763-ebdf9339e94a.lovable.app-1778336044703.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;0,6..96,800;1,6..96,400&family=Inter:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
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
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
