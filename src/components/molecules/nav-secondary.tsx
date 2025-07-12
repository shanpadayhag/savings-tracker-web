"use client";

import * as React from "react";
import { IconSettings, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/atoms/sidebar";

export function NavSecondary(
  props: React.ComponentPropsWithoutRef<typeof SidebarGroup>
) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={"#"}>
                <IconSettings />
                <span>Settings</span> <span className="text-muted-foreground">(Coming Soon)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
