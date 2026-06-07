import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "./LangSwitcher";
import { Button } from "@/components/ui/button";
import logo from "@/assets/pirc-logo.png";
import { Menu, X, LogOut, User2, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePiAuth } from "@/lib/pi-auth-context";

export function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, status, signIn, signOut } = usePiAuth();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/wallet", label: t("nav.wallet") },
    { to: "/matrix", label: t("nav.matrix", "Matrix") },
    { to: "/monetary", label: t("nav.monetary", "Monetary") },
    { to: "/resources", label: t("nav.resources") },
    { to: "/contracts", label: t("nav.contracts") },
    { to: "/justice", label: t("nav.justice", "Justice") },
    { to: "/governance", label: t("nav.governance") },
    { to: "/sync", label: t("nav.sync", "Sync") },
    { to: "/alpha-hub", label: t("nav.alpha") },
    { to: "/developers", label: t("nav.developers") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="PiRC" width={36} height={36} className="h-9 w-9" />
          <div className="leading-tight">
            <div className="font-bold tracking-tight text-foreground">{t("brand")}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pi Network</div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher />
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/60 text-xs text-foreground">
                <User2 className="h-3.5 w-3.5 text-gold" /> @{user.username}
              </span>
              <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={signIn}
              disabled={status === "authenticating"}
              className="bg-gradient-gold text-gold-foreground hover:opacity-90 font-semibold"
            >
              {status === "authenticating" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("cta.connect")}</>
              ) : (
                t("cta.connect")
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="xl:hidden" onClick={() => setOpen(!open)} aria-label="menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="xl:hidden border-t border-border/40 px-4 py-3 flex flex-col gap-1 glass">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
