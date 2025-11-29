"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { HelpCircle } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function Header() {
  const { apiKey, setApiKey } = useApiKey();
  const pathname = usePathname();
  
  const isClassicalActive = pathname?.startsWith('/classical');
  const isAskActive = pathname === '/ask';

  return (
    <header className="relative flex justify-center h-20 gap-2.5 items-center">
      <NavigationMenu className="z-1">
        <NavigationMenuList className="flex-wrap">
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              className={cn(
                isClassicalActive && "bg-accent text-accent-foreground"
              )}
            >
              Classical
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <>
                    <div
                      className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-4 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6"
                    >
                      <div className="mb-2 text-lg font-medium sm:mt-4">
                        Classical
                      </div>
                      <p className="text-muted-foreground text-sm leading-tight">
                        Pretty old way to get data
                      </p>
                    </div>
                  </ >
                </li>
                <ListItem href="/classical?type=future" title="Fetch upcoming bookings">
                  Get latest N future schedule updates
                </ListItem>
                <ListItem href="/classical?type=past" title="Fetch past bookings">
                  Get latest N past schedule updates
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink 
              asChild 
              className={cn(
                navigationMenuTriggerStyle(),
                isAskActive && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/ask">Ask thing</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="absolute left-4 w-full flex justify-end pr-10 z-0">
        <InputGroup className="w-60">
          <InputGroupInput
            placeholder="Enter Open-AI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupAddon>
                <InputGroupButton
                  variant="ghost"
                  aria-label="Help"
                  size="icon-xs"
                >
                  <HelpCircle />
                </InputGroupButton>
              </InputGroupAddon>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Enter your Open-AI Api key for generating summary and asking questions</p>
            </TooltipContent>
          </Tooltip>
        </InputGroup>
      </div>
    </header>
  );
}

