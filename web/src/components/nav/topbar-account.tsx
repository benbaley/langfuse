/* eslint-disable @repo/no-style-props, @repo/no-abstracted-overlay-trigger */
"use client";

import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/src/features/i18n";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOutCleanly } from "@/src/features/auth/lib/signOut";
import { Avatar } from "@/src/components/design-system/Avatar/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ThemeToggle } from "@/src/features/theming/ThemeToggle";
import { useV4UpgradeUiFlag } from "@/src/features/v4-migration/useV4UpgradeUiEnabled";
import { cn } from "@/src/utils/tailwind";

/**
 * Compact account affordance for the mobile top bar: the user's avatar opening
 * a small menu (settings, theme, sign out). The sidebar keeps the full NavUser;
 * this is the always-visible shell-level shortcut in the minimal mobile chrome.
 */
export const TopbarAccount = ({
  user,
  className,
}: {
  user: NonNullable<Session["user"]>;
  className?: string;
}) => {
  const { t } = useTranslation("navigation");
  const showV4Migration = useV4UpgradeUiFlag();

  const name = user.name ?? "";
  const email = user.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-hidden",
          className,
        )}
        aria-label={t("accountMenu")}
      >
        <Avatar
          size="lg"
          src={user.image ?? undefined}
          displayName={name || email || t("user")}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="grid text-left text-sm leading-tight">
            <span className="truncate font-bold" title={name}>
              {name}
            </span>
            <span
              className="text-muted-foreground truncate text-xs"
              title={email}
            >
              {email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/settings">{t("accountSettings")}</Link>
        </DropdownMenuItem>
        {showV4Migration ? (
          <DropdownMenuItem asChild>
            <Link href="/v4-migration">{t("v4Migration")}</Link>
          </DropdownMenuItem>
        ) : null}
        {/* ThemeToggle stops propagation itself; keep the row from closing the
            menu so the user can flip themes and keep the menu open. */}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <ThemeToggle />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
          <LanguageSelector />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOutCleanly().catch(() => {});
          }}
        >
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
