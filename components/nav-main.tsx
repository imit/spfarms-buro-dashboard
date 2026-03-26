"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: React.ReactNode
}

const STORAGE_KEY = "sidebar-groups"

function readGroupState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeGroupState(key: string, open: boolean) {
  try {
    const state = readGroupState()
    state[key] = open
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function NavMain({
  label,
  items,
}: {
  label?: string
  items: NavMainItem[]
}) {
  const pathname = usePathname()

  const hasActiveItem = label
    ? items.some((item) =>
        item.url === "/admin"
          ? pathname === "/admin"
          : pathname === item.url || pathname.startsWith(item.url + "/")
      )
    : false

  const [open, setOpen] = useState(() => {
    if (!label) return true
    const saved = readGroupState()
    if (label in saved) return saved[label]
    // Default collapsed unless an item is active
    return hasActiveItem
  })

  // If user navigates to an item in a collapsed group, expand it
  useEffect(() => {
    if (label && hasActiveItem && !open) {
      setOpen(true)
    }
  }, [hasActiveItem]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = useCallback(
    (value: boolean) => {
      setOpen(value)
      if (label) writeGroupState(label, value)
    },
    [label]
  )

  const content = (
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            item.url === "/admin"
              ? pathname === "/admin"
              : pathname === item.url || pathname.startsWith(item.url + "/")

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  )

  if (label) {
    return (
      <Collapsible open={open} onOpenChange={handleOpenChange} className="group/section">
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="cursor-pointer select-none">
              {label}
              <ChevronRightIcon className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/section:rotate-90" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {content}
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    )
  }

  return (
    <SidebarGroup>
      {content}
    </SidebarGroup>
  )
}
