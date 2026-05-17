import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Package, Bell, HelpCircle, Settings, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — DERYA Chic" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="px-5 pt-10 text-sm text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="px-5 pt-12 max-w-md mx-auto text-center">
        <h1 className="font-display text-3xl tracking-[0.04em]">Your space awaits</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to track orders, save favorites, and check out faster.
        </p>
        <Link
          to="/login"
          search={{ redirect: "/profile", mode: "signin" }}
          className="mt-6 inline-flex items-center justify-center gap-2 bg-foreground text-background rounded-[14px] px-6 py-3.5 text-sm font-semibold w-full"
        >
          <LogIn className="w-4 h-4" /> Sign in
        </Link>
        <Link
          to="/login"
          search={{ redirect: "/profile", mode: "signup" }}
          className="mt-3 inline-flex items-center justify-center text-sm underline text-muted-foreground"
        >
          Create an account
        </Link>
      </div>
    );
  }

  const initial = (user.email ?? "B")[0].toUpperCase();
  const ROWS: Array<{ icon: any; label: string; to?: "/orders" }> = [
    { icon: Package, label: "Orders", to: "/orders" },
    { icon: Bell, label: "Notifications" },
    { icon: Settings, label: "Preferences" },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <div className="px-5 lg:px-10 pt-6 max-w-2xl mx-auto pb-24">
      <h1 className="font-display text-3xl tracking-[0.04em]">Profile</h1>

      <div className="mt-6 glass rounded-[24px] p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-neon flex items-center justify-center text-neon-foreground text-lg font-bold">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{(user.user_metadata as any)?.full_name ?? "DERYA Chic Member"}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
        </div>
        {isAdmin && (
          <span className="text-[10px] uppercase tracking-widest text-neon border border-neon/40 rounded-full px-2.5 py-1">
            Admin
          </span>
        )}
      </div>

      <div className="mt-5 glass rounded-[24px] overflow-hidden">
        {ROWS.map((r, i) => {
          const inner = (
            <>
              <r.icon className="w-4 h-4 text-neon" />
              <span className="flex-1 text-left text-sm">{r.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </>
          );
          const cls = `w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition ${
            i !== ROWS.length - 1 ? "border-b border-border" : ""
          }`;
          return r.to ? (
            <Link key={r.label} to={r.to} className={cls}>{inner}</Link>
          ) : (
            <button key={r.label} className={cls}>{inner}</button>
          );
        })}
      </div>

      <div className="mt-5 glass rounded-[24px] overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Support & Socials</p>
        </div>
        <a
          href="https://wa.me/212615624760"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-4 px-5 py-4 border-b border-border hover:bg-muted/40 hover:opacity-90 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-foreground/80" aria-hidden="true">
            <path d="M3 21l1.65-4.5A8.5 8.5 0 1 1 7.5 19.5L3 21z" />
            <path d="M8.5 9.5c.3 1.5 1.2 2.9 2.5 3.9 1.3 1 2.8 1.6 4.3 1.7.4 0 .8-.2 1-.5l.6-.9c.2-.3.1-.7-.2-.9l-1.5-1c-.3-.2-.7-.2-1 0l-.5.4a6 6 0 0 1-2.8-2.8l.4-.5c.2-.3.2-.7 0-1l-1-1.5c-.2-.3-.6-.4-.9-.2l-.9.6c-.3.2-.5.6-.5 1z" />
          </svg>
          <span className="flex-1 text-left text-sm">WhatsApp</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
        <a
          href="https://www.instagram.com/derya_chic2?igsh=MWJjMHd5MjZ0bzh0Zw=="
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/40 hover:opacity-90 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-foreground/80" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
          </svg>
          <span className="flex-1 text-left text-sm">Instagram</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>

      <button
        onClick={async () => {
          await signOut();
          toast.success("Signed out");
          navigate({ to: "/" });
        }}
        className="mt-5 w-full glass rounded-[18px] py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/40 transition"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>

      <p className="text-center text-[10px] text-muted-foreground tracking-[0.3em] mt-10 uppercase">
        DERYA Chic · est. 2026
      </p>
    </div>
  );
}
