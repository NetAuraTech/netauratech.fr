import { useEffect, useState } from 'react'
import { NavLink } from '~/components/atoms/nav_link'
import { Link } from '@adonisjs/inertia/react'
import { router, usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pageProps = usePage<SharedProps>().props

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = (_?: any) => {
    setIsMenuOpen(false)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  useEffect(() => {
    const unregisterListener = router.on('success', () => {
      setIsMenuOpen(false)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })

    return () => unregisterListener()
  }, [])

  const menuState = isMenuOpen ? 'opened' : 'closed'
  const isExpanded = isMenuOpen ? 'true' : 'false'

  return (
    <header className="header" data-state={menuState} aria-expanded={isExpanded}>
      <Link
        href="/"
        className="header__logo font-semibold tracking-wide text-xl font-cormorant"
        onClick={closeMenu}
      >
        {pageProps.app_name}
      </Link>

      <nav
        id="primary-navigation"
        className="header__nav"
        data-state={menuState}
        aria-expanded={isExpanded}
      >
        <NavLink href="/" label="Home" variant="nav" onClick={closeMenu} />
      </nav>
      <button
        className="header__burger md:display-hidden"
        aria-controls="primary-navigation"
        aria-expanded={isExpanded}
        data-state={menuState}
        aria-label="Menu"
        onClick={toggleMenu}
      >
        <svg
          stroke="currentColor"
          fill="none"
          className="hamburger"
          viewBox="-10 -10 120 120"
          width="50"
        >
          <path
            className="line"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m 20 40 h 60 a 1 1 0 0 1 0 20 h -60 a 1 1 0 0 1 0 -40 h 30 v 70"
          ></path>
        </svg>
      </button>
    </header>
  )
}
