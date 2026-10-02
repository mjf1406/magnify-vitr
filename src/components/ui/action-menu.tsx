import { MoreVerticalIcon } from "lucide-react";
import { Fragment, type ReactNode, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ActionMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  /** Consecutive items with the same group share a DropdownMenuGroup; changes insert separators. */
  group?: string;
  onSelect: () => void;
};

type ActionMenuProps = {
  items: Array<ActionMenuItem>;
  label: string;
  align?: "start" | "center" | "end";
  className?: string;
};

/** Overflow action menu. Renders nothing when `items` is empty. */
export function ActionMenu({ items, label, align = "end", className }: ActionMenuProps) {
  const visibleItems = useMemo(() => items, [items]);

  if (visibleItems.length === 0) {
    return null;
  }

  const groups: Array<Array<ActionMenuItem>> = [];
  for (const item of visibleItems) {
    const groupKey = item.group ?? item.id;
    const last = groups[groups.length - 1];
    const lastKey = last?.[0]?.group ?? last?.[0]?.id;
    if (last && lastKey === groupKey) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn("relative z-10", className)}
            aria-label={label}
          />
        }
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {groups.map((group, groupIndex) => (
          <Fragment key={group[0]?.id ?? groupIndex}>
            {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              {group.map((item) => (
                <DropdownMenuItem key={item.id} variant={item.variant} onClick={item.onSelect}>
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
