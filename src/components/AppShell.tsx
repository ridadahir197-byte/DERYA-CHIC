import { Link, useLocation } from "@tanstack/react-router";
import { Home, Heart, User, ShoppingBag, Search, Sun, Moon, LayoutDashboard, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: Search },
  { to: "/favorites", label: "Wishlist", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("derya-theme")) as
      | "light"
      | "dark"
      | null;
    const initial = stored ?? "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("derya-theme", next);
      return next;
    });
  };
  return { theme, toggle };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const cartCount = useCart((s) => s.count());
  const { theme, toggle } = useTheme();
  const { isAdmin } = useAuth();

  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);

  // Admin routes have their own shell
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* ===== Top Header — luxury editorial ===== */}
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-border/60">
          <div className="mx-auto max-w-7xl px-5 lg:px-10 h-16 lg:h-20 grid grid-cols-3 items-center">
            {/* Left — desktop nav / mobile theme toggle */}
            <div className="flex items-center justify-start">
              <nav className="hidden lg:flex items-center gap-8 text-[12px] tracking-[0.18em] uppercase font-medium">
                <Link to="/" className="hover:text-neon transition-colors" activeProps={{ className: "text-foreground" }}>
                  Home
                </Link>
                <Link to="/shop" className="hover:text-neon transition-colors" activeProps={{ className: "text-foreground" }}>
                  Shop
                </Link>
                <Link to="/favorites" className="hover:text-neon transition-colors" activeProps={{ className: "text-foreground" }}>
                  Wishlist
                </Link>
              </nav>
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="lg:hidden inline-flex w-10 h-10 rounded-full items-center justify-center hover:bg-muted transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="w-[18px] h-[18px]" strokeWidth={1.6} />
                ) : (
                  <Sun className="w-[18px] h-[18px]" strokeWidth={1.6} />
                )}
              </button>
            </div>

            {/* Center — DERYA Chic brand */}
            <Link to="/" className="flex items-center justify-center gap-2 select-none">
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-neon" aria-hidden />
              <h1 className="font-display text-[18px] lg:text-[24px] font-semibold tracking-[0.22em] lg:tracking-[0.28em] leading-none uppercase">
                DERYA <span className="italic font-normal tracking-[0.08em] lg:tracking-[0.12em]">Chic</span>
              </h1>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-neon" aria-hidden />
            </Link>

            {/* Right — actions */}
            <div className="flex items-center justify-end gap-1.5 lg:gap-3">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="hidden lg:inline-flex w-10 h-10 rounded-full items-center justify-center hover:bg-muted transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="w-[18px] h-[18px]" strokeWidth={1.6} />
                ) : (
                  <Sun className="w-[18px] h-[18px]" strokeWidth={1.6} />
                )}
              </button>
              <Link
                to="/shop"
                aria-label="Search"
                className="inline-flex w-10 h-10 rounded-full items-center justify-center hover:bg-muted transition-colors"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.6} />
              </Link>
              <Link
                to={"/localisation" as any}
                aria-label="Boutique location"
                className="inline-flex w-10 h-10 rounded-full items-center justify-center hover:bg-muted hover:scale-105 transition-all duration-300"
              >
                <MapPin className="w-[18px] h-[18px]" strokeWidth={1.6} />
              </Link>
              <Link
                to="/cart"
                aria-label="Bag"
                className="relative inline-flex w-10 h-10 rounded-full items-center justify-center hover:bg-muted transition-colors"
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.6} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-neon text-neon-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ring-2 ring-background">
                    {cartCount}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link
                  to={"/admin" as any}
                  aria-label="Admin"
                  className="inline-flex w-10 h-10 rounded-full items-center justify-center hover:bg-muted transition-colors text-neon"
                  title="Admin"
                >
                  <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={1.6} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== Main ===== */}
      <main className="mx-auto max-w-7xl pb-32 lg:pb-16">{children}</main>

      {/* ===== Bottom nav — mobile only ===== */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px]">
        <div className="glass-strong rounded-full px-3 py-2 flex justify-between items-center shadow-elevated">
          {navItems.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex-1 flex flex-col items-center justify-center py-2"
                aria-label={item.label}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-neon/15 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: active ? 1.12 : 1 }}
                  className="relative"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? "text-neon" : "text-muted-foreground"
                    }`}
                    strokeWidth={active ? 2.2 : 1.7}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
