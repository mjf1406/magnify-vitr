import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDownIcon, MenuIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "../theme/theme-toggle";
import { NavUser } from "@/components/navigation/NavUser";
import { Logo } from "@/components/brand/Logo";
import { ConnectionStatus } from "@/components/navigation/ConnectionStatus";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { db } from "@/lib/instant/db";

const ABOUT_LINK = { to: "/about" as const, labelKey: "about" };

const AUTH_NAV_LINKS = [
  { to: "/files" as const, labelKey: "files" },
  { to: "/account" as const, labelKey: "account" },
  { to: "/settings" as const, labelKey: "settings" },
  ABOUT_LINK,
];

const desktopLinkClassName =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const mobileLinkClassName =
  "block w-full rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function Navbar() {
  const { t } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navShown, setNavShown] = useState(false);
  const isMobile = useIsMobile();
  const navHidden = isMobile && !navShown;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = db.useAuth();
  const isAuthenticated = Boolean(user);
  const homeTo = "/" as const;
  const navLinks = isAuthenticated ? AUTH_NAV_LINKS : [ABOUT_LINK];

  useEffect(() => {
    setNavShown(false);
  }, [pathname]);

  return (
    <>
      {navShown ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setNavShown(false)}
        />
      ) : (
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label={t("showNav")}
          className="fixed top-[max(0.25rem,env(safe-area-inset-top))] left-1/2 z-40 -translate-x-1/2 md:hidden"
          onClick={() => setNavShown(true)}
        >
          <ChevronDownIcon />
        </Button>
      )}
      <header
        inert={navHidden}
        aria-hidden={navHidden || undefined}
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-border bg-background pt-[env(safe-area-inset-top)] transition-transform md:sticky md:translate-y-0",
          navShown ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="relative mx-auto flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-8">
          <Link
            to={homeTo}
            className="flex shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Logo />
          </Link>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 md:flex">
            {navLinks.map(({ to, labelKey }) => (
              <Link key={to} to={to} className={desktopLinkClassName}>
                {t(labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {navLinks.length > 0 ? (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
                  <MenuIcon />
                  <span className="sr-only">{t("openNavMenu")}</span>
                </SheetTrigger>
                <SheetContent side="right" className="w-3/4 sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>{t("navMenu")}</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-1 flex-col gap-1 px-4">
                    {navLinks.map(({ to, labelKey }) => (
                      <Link
                        key={to}
                        to={to}
                        className={mobileLinkClassName}
                        onClick={() => setMobileOpen(false)}
                      >
                        {t(labelKey)}
                      </Link>
                    ))}
                  </nav>
                  <SheetFooter className="border-t border-border">
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <LanguageSwitcher />
                    </div>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ) : null}
            <ConnectionStatus />
            <NavUser variant="avatar" />
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
