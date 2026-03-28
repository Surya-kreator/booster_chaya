"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { LayoutDashboard, Menu, X } from "lucide-react"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks: {
    href: string
    label: string
    icon?: LucideIcon
  }[] = [
    { href: "#menu", label: "Menu" },
    { href: "#about", label: "About" },
    { href: "#reviews", label: "Reviews" },
    { href: "#contact", label: "Contact" },
    { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight text-foreground"
        >
          Booster Chaya
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm tracking-wide uppercase"
                >
                  {Icon ? (
                    <Icon className="size-4 shrink-0" strokeWidth={2} />
                  ) : null}
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden md:flex items-center">
          <Link
            href="#contact"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity duration-300"
          >
            Contact Now
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden text-foreground p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <ul className="container mx-auto px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300 text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {Icon ? (
                    <Icon className="size-5 shrink-0" strokeWidth={2} />
                  ) : null}
                  {link.label}
                </Link>
              </li>
            )
          })}
          <li className="pt-4">
            <Link
              href="#contact"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Now
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
