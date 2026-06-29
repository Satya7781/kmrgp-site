"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { AuthModal } from "@/components/auth/AuthModal"
import { logoutAction } from "@/lib/actions/auth"
import type { SessionUser } from "@/types"

interface HeaderClientProps {
  session: SessionUser | null
}

export function HeaderClient({ session }: HeaderClientProps) {
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<"login" | "register">("login")

  const openLogin = () => {
    setAuthTab("login")
    setAuthOpen(true)
  }

  const openRegister = () => {
    setAuthTab("register")
    setAuthOpen(true)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gold-light bg-cream/97 backdrop-blur-md shadow-sm">
      <div className="rajput-border" />
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gold bg-gradient-to-br from-maroon to-saffron font-heading text-xl font-extrabold text-white">
            K
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-maroon">Kshatriya Mewar Rajput</span>
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-saffron">Parivar · Uniting Families</span>
          </div>
        </Link>

        <nav className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/profiles">Find Matches</NavLink>
            {session && <NavLink href="/dashboard">My Dashboard</NavLink>}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-gold-light bg-cream-dark pl-1 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-maroon">{session.username || "Member"}</span>
                  <span className="text-[9px] font-bold uppercase text-saffron">{session.role.replace("_", " ")}</span>
                </div>
              </Link>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">Log Out</Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={openLogin}>Login</Button>
              <Button size="sm" onClick={openRegister}>Join Free</Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <div className="mb-6 border-b border-gold-light pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Navigation</span>
            </div>
            <nav className="flex flex-col gap-2">
              <MobileLink href="/">🏠 Home</MobileLink>
              <MobileLink href="/profiles">🔍 Find Matches</MobileLink>
              {session && <MobileLink href="/dashboard">👤 My Dashboard</MobileLink>}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-gold-light pt-6">
              {session ? (
                <form action={logoutAction}>
                  <Button type="submit" variant="outline" className="w-full">Log Out</Button>
                </form>
              ) : (
                <>
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full" onClick={openLogin}>Login</Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button className="w-full" onClick={openRegister}>Join Parivar</Button>
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="relative rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-maroon-light hover:text-maroon"
      >
        {children}
      </Link>
    </li>
  )
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-bold text-maroon transition hover:bg-gold-light hover:pl-5"
      >
        {children}
      </Link>
    </SheetClose>
  )
}
