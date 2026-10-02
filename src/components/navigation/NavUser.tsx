import { Link, useNavigate } from "@tanstack/react-router";
import { FolderOpen, LogOut, Settings, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { getDisplayName, getInitials } from "@/lib/user/userDisplay";
import { sanitizeAvatarUrl } from "../../../shared/avatarUrl";
import { db } from "@/lib/instant/db";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function useAccountMenuState() {
  const navigate = useNavigate();
  const { isLoading, user: authUser } = db.useAuth();
  const { data: user } = useCurrentUser();

  const handleSignOut = async () => {
    await db.auth.signOut();
    await navigate({ to: "/login" });
  };

  return {
    isLoading,
    isAuthenticated: Boolean(authUser),
    user,
    signOut: handleSignOut,
  };
}

function AccountMenuItems({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useTranslation("common");

  return (
    <>
      <DropdownMenuItem render={<Link to="/files" />}>
        <FolderOpen />
        {t("files")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link to="/settings" />}>
        <Settings />
        {t("settings")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link to="/account" />}>
        <UserRound />
        {t("account")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          onSignOut();
        }}
      >
        <LogOut />
        {t("signOut")}
      </DropdownMenuItem>
    </>
  );
}

export function NavUser({ variant: _variant = "avatar" }: { variant?: "sidebar" | "avatar" }) {
  const { t } = useTranslation("common");
  const { isLoading, isAuthenticated, user, signOut } = useAccountMenuState();

  if (isLoading || (isAuthenticated && user === undefined)) {
    return (
      <Avatar>
        <AvatarFallback>...</AvatarFallback>
      </Avatar>
    );
  }

  if (!user?.email) {
    return (
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/login" />}>
        {t("signIn")}
      </Button>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(user);
  const safeImage = sanitizeAvatarUrl(user.image);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={t("openUserMenu")}
          />
        }
      >
        <Avatar>
          {safeImage ? (
            <AvatarImage src={safeImage} alt={displayName} referrerPolicy="no-referrer" />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <AccountMenuItems
          onSignOut={() => {
            void signOut();
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
