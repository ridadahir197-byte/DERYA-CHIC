import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Image as ImageIcon,
  Sparkles,
  ShoppingBag,
  Users,
  ArrowLeft,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_admin")({
  head: () => ({ meta: [{ title: "Admin — DERYA Chic" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },
  { to: "/admin/special", label: "Special For You", icon: Sparkles },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: "/admin", mode: "signin" } });
    } else if (!loading && user && !isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-muted/20">
        <div className="px-6 py-6 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neon" />
            <span className="font-display text-[15px] tracking-[0.22em] uppercase font-semibold">
              DERYA <span className="italic font-normal tracking-[0.08em]">Chic</span>
            </span>
          </Link>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.7} />
            Back to store
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.7} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass-strong border-b border-border/60 px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Store
        </Link>
        <span className="font-display text-sm tracking-[0.2em] uppercase font-semibold">
          DERYA <span className="italic font-normal">Admin</span>
        </span>
        <button onClick={() => signOut()} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {/* Mobile bottom nav for admin sections */}
        <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[480px] glass-strong rounded-full px-2 py-2 flex justify-between items-center shadow-elevated">
          {nav.slice(0, 5).map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                aria-label={item.label}
                className={`flex-1 flex items-center justify-center py-2 rounded-full ${
                  active ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.8} />
              </Link>
            );
          })}
        </nav>

        <div className="px-5 md:px-10 py-6 md:py-10 pb-28 md:pb-10 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
