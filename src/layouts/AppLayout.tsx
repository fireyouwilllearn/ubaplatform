import { useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { appEnv } from '../lib/env';
import { useAuth } from '../lib/auth';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDropdown } from '../components/NotificationDropdown';
import { navigation } from '../routes';
import type { NavItem, RouteId } from '../types/domain';

type Theme = 'dark' | 'light';

const routeGlyphs: Record<RouteId, string> = {
  dashboard: '01',
  schedule: 'GM',
  standings: 'ST',
  myPlayer: 'MP',
  playerProfile: 'ID',
  teams: 'TM',
  teamIdentity: 'TI',
  trades: 'TR',
  freeAgency: 'FA',
  salaryCap: 'SC',
  rosterManagement: 'RM',
  injuries: 'INJ',
  importReview: 'IR',
  league: 'LG',
  announcements: 'NW',
  notifications: 'AL',
  calculator: 'CAL',
  admin: 'OPS',
  settings: 'SET',
  leaderboard: 'LB',
  playerStats: 'ST2',
};

const tickerItems = [
  'NYE leads the West',
  'Trade proposal received from Las Vegas',
  'Week 6 lock: Friday night',
  'Season 2026 is live',
  '16 sheets linked',
];

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem('uba-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'League',
    items: ['schedule', 'standings', 'playerStats', 'league', 'announcements'].map(id => navigation.find(n => n.id === id)!).filter(Boolean),
  },
  {
    label: 'Teams',
    items: ['teams', 'myPlayer', 'playerProfile', 'teamIdentity', 'rosterManagement'].map(id => navigation.find(n => n.id === id)!).filter(Boolean),
  },
  {
    label: 'Transactions',
    items: ['trades', 'freeAgency', 'salaryCap', 'injuries'].map(id => navigation.find(n => n.id === id)!).filter(Boolean),
  },
  {
    label: 'Tools',
    items: ['calculator', 'importReview', 'notifications'].map(id => navigation.find(n => n.id === id)!).filter(Boolean),
  },
  {
    label: 'Admin',
    items: ['admin', 'settings'].map(id => navigation.find(n => n.id === id)!).filter(Boolean),
  },
];

function CategoryDropdown({ group, id, onClose }: { group: NavGroup; id: string; onClose: () => void }) {
  return (
    <div id={id} className="absolute left-1/2 top-full z-50 mt-2 w-52 -translate-x-1/2 origin-top animate-dropdown rounded-xl border border-[var(--app-border)] bg-[var(--navy2)] p-1.5 shadow-xl shadow-[color:var(--shadow-menu)]">
      <div className="grid gap-0.5">
        <span className="px-3 pb-1 pt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--text2)]">{group.label}</span>
        {group.items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.7rem] font-bold uppercase tracking-[0.06em] transition ${
                isActive ? 'bg-uba-gold/16 text-uba-gold-light' : 'text-[var(--text2)] hover:bg-[var(--navy4)] hover:text-[var(--text)]'
              }`
            }
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--navy4)] text-[0.55rem] opacity-80">{routeGlyphs[item.id]}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

const dashboardItem = navigation.find(n => n.id === 'dashboard')!;

/* === Sub-components === */

function TickerBar() {
  return (
    <div className="ticker-strip">
      <div className="ticker-inner">
        {Array.from({ length: 2 }).map((_, dupIdx) =>
          tickerItems.map((item, idx) => (
            <span key={`${dupIdx}-${item}`} className="ticker-item">
              <span>{item}</span>
              {idx < tickerItems.length - 1 && <span className="ticker-sep">|</span>}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="bell-btn"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <span className={`absolute inset-0 grid place-items-center transition-all duration-300 ${
        theme === 'dark' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </span>
      <span className={`absolute inset-0 grid place-items-center transition-all duration-300 ${
        theme === 'dark' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
      }`}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>
    </button>
  );
}

interface NavSidebarProps {
  openGroup: string | null;
  setOpenGroup: Dispatch<SetStateAction<string | null>>;
}

function NavSidebar({ openGroup, setOpenGroup }: NavSidebarProps) {
  const loc = useLocation();
  const isDashboard = loc.pathname === '/';
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const activeGroup = useMemo(() => {
    if (isDashboard) return null;
    for (const group of navGroups) {
      if (group.items.some(item => loc.pathname.startsWith(item.path))) {
        return group.label;
      }
    }
    return null;
  }, [loc.pathname, isDashboard]);

  function openGroupDelayed(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(label);
  }

  function closeGroupDelayed() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenGroup(null), 120);
  }

  function toggleGroup(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(current => (current === label ? null : label));
  }

  function handleGroupKeyDown(event: KeyboardEvent<HTMLButtonElement>, label: string) {
    if (event.key === 'Escape') {
      setOpenGroup(null);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleGroup(label);
    }
  }

  return (
    <nav className="hidden flex-1 items-center justify-center gap-0 lg:flex" aria-label="Primary navigation">
      <NavLink
        to={dashboardItem.path}
        end
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        {dashboardItem.label}
      </NavLink>

      {navGroups.map(group => (
        <div
          key={group.label}
          className="relative"
          onMouseEnter={() => openGroupDelayed(group.label)}
          onMouseLeave={closeGroupDelayed}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setOpenGroup(null);
            }
          }}
        >
          <button
            type="button"
            className={`nav-link ${openGroup === group.label || activeGroup === group.label ? 'active' : ''}`}
            onClick={() => toggleGroup(group.label)}
            onFocus={() => openGroupDelayed(group.label)}
            onKeyDown={(event) => handleGroupKeyDown(event, group.label)}
            aria-expanded={openGroup === group.label}
            aria-controls={`nav-menu-${group.label.toLowerCase()}`}
            aria-label={`${group.label} navigation`}
          >
            <span>{group.label}</span>
            <svg className={`ml-1 h-2.5 w-2.5 transition-transform duration-200 ${openGroup === group.label ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openGroup === group.label && (
            <div onMouseEnter={() => openGroupDelayed(group.label)} onMouseLeave={closeGroupDelayed}>
              <CategoryDropdown group={group} id={`nav-menu-${group.label.toLowerCase()}`} onClose={() => setOpenGroup(null)} />
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

interface MobileNavDrawerProps {
  showMobileOverflow: boolean;
  onCloseMobile: () => void;
  onOpenMobileGroup: (label: string) => void;
}

function MobileNavDrawer({ showMobileOverflow, onCloseMobile, onOpenMobileGroup }: MobileNavDrawerProps) {
  return (
    <>
      <nav className="nav-glass mobile-safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-[var(--app-border)] px-2 pt-2 shadow-[0_-18px_44px_var(--shadow-nav)] backdrop-blur-2xl lg:hidden" aria-label="Mobile navigation">
        <div className="mx-auto flex max-w-md items-center justify-around gap-0.5 pb-2">
          <NavLink
            to={dashboardItem.path}
            end
            className={({ isActive }) =>
              `flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-center transition ${
                isActive ? 'bg-uba-gold/16 text-uba-gold-light' : 'text-app-muted hover:bg-[var(--navy4)] hover:text-[color:var(--app-text)]'
              }`
            }
          >
            <span className="block text-[0.68rem] font-black tracking-[0.08em]">{routeGlyphs[dashboardItem.id]}</span>
            <span className="block whitespace-nowrap text-[0.5rem] font-bold">{dashboardItem.label}</span>
          </NavLink>
          {navGroups.map(group => (
            <button
              key={group.label}
              type="button"
              onClick={() => onOpenMobileGroup(group.label)}
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-center transition text-app-muted hover:bg-[var(--navy4)] hover:text-[color:var(--app-text)]"
              aria-label={`${group.label} navigation`}
            >
              <span className="block text-[0.5rem] font-black tracking-[0.08em] opacity-70">{group.label.slice(0, 3).toUpperCase()}</span>
              <span className="block whitespace-nowrap text-[0.5rem] font-bold">{group.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showMobileOverflow && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/62"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          />
          <div className="absolute bottom-0 left-0 right-0 animate-soft-rise rounded-t-2xl border-t border-uba-gold/25 bg-[var(--navy2)] px-4 pb-10 pt-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-uba-gold/45" />
            {navGroups.map(group => (
              <div key={group.label} className="mb-3 last:mb-0">
                <span className="block px-1 pb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--text2)]">{group.label}</span>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition ${
                          isActive ? 'bg-uba-gold/16 text-uba-gold-light' : 'text-[var(--text2)] hover:bg-[var(--navy4)] hover:text-[var(--text)]'
                        }`
                      }
                    >
                      <span className="text-[0.58rem] font-black tracking-[0.08em] opacity-70">{routeGlyphs[item.id]}</span>
                      <span className="text-[0.55rem] font-bold">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* === UI Panel State (useReducer) === */

interface UIPanelState {
  showNotifications: boolean;
  showMobileOverflow: boolean;
  showUserMenu: boolean;
}

type UIPanelAction =
  | { type: 'TOGGLE_NOTIFICATIONS' }
  | { type: 'TOGGLE_MOBILE_OVERFLOW' }
  | { type: 'TOGGLE_USER_MENU' }
  | { type: 'SET_MOBILE_OVERFLOW'; value: boolean }
  | { type: 'CLOSE_ALL' };

function uiPanelReducer(state: UIPanelState, action: UIPanelAction): UIPanelState {
  switch (action.type) {
    case 'TOGGLE_NOTIFICATIONS':
      return { ...state, showNotifications: !state.showNotifications };
    case 'TOGGLE_MOBILE_OVERFLOW':
      return { ...state, showMobileOverflow: !state.showMobileOverflow };
    case 'TOGGLE_USER_MENU':
      return { ...state, showUserMenu: !state.showUserMenu };
    case 'SET_MOBILE_OVERFLOW':
      return { ...state, showMobileOverflow: action.value };
    case 'CLOSE_ALL':
      return { showNotifications: false, showMobileOverflow: false, showUserMenu: false };
    default:
      return state;
  }
}

/* === Main Layout === */

export function AppLayout() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [uiPanel, dispatch] = useReducer(uiPanelReducer, {
    showNotifications: false,
    showMobileOverflow: false,
    showUserMenu: false,
  });
  const [signingIn, setSigningIn] = useState(false);
  const [bellRing, setBellRing] = useState(false);
  const { user, error: authError, signIn, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const headerRef = useRef<HTMLElement>(null);
  const prevUnread = useRef(unreadCount);

  function handleCloseMobile() {
    dispatch({ type: 'SET_MOBILE_OVERFLOW', value: false });
    setOpenGroup(null);
  }

  function handleOpenMobileGroup(label: string) {
    dispatch({ type: 'SET_MOBILE_OVERFLOW', value: true });
    setOpenGroup(label);
  }

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.dataset['theme'] = theme;
    try { localStorage.setItem('uba-theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const handler = () => {
      if (!headerRef.current) return;
      headerRef.current.classList.toggle('header-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setBellRing(true);
      const t = setTimeout(() => setBellRing(false), 500);
      prevUnread.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnread.current = unreadCount;
    return;
  }, [unreadCount]);

  /* Top-of-page load bar: animate on mount */
  useEffect(() => {
    const bar = document.getElementById('load-bar');
    if (!bar) return;
    const raf = requestAnimationFrame(() => {
      bar.style.width = '0%';
      bar.classList.add('running');
      requestAnimationFrame(() => {
        bar.style.width = '100%';
      });
    });
    const timeout = setTimeout(() => {
      bar.style.opacity = '0';
      setTimeout(() => {
        bar.style.width = '0%';
        bar.classList.remove('running');
      }, 400);
    }, 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="arena-shell min-h-screen overflow-x-hidden">
      <div id="load-bar" className="load-bar" />
      <div className="arena-backdrop" />

      <header ref={headerRef} className="main-header sticky top-0 z-40 transition-all duration-300">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-2 px-4 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label="UBA Platform home">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#c9a84c33] bg-[var(--navy4)] p-0.5">
              <img src="/logo.png" alt={appEnv.appName} className="h-full w-full object-cover" />
            </span>
            <span className="logo-text hidden sm:block">UBA Platform</span>
          </NavLink>

          <NavSidebar openGroup={openGroup} setOpenGroup={setOpenGroup} />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="sheets-badge hidden 2xl:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--c-green)] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              Sheets connected
            </span>

            <div className="relative">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_USER_MENU' })}
                    onKeyDown={(event) => { if (event.key === 'Escape') { dispatch({ type: 'CLOSE_ALL' }); (event.target as HTMLElement).blur(); } }}
                    className="bell-btn overflow-hidden"
                    aria-label="User menu"
                    aria-expanded={uiPanel.showUserMenu}
                  >
                    {user.user_metadata?.['avatar_url'] ? (
                      <img src={user.user_metadata['avatar_url']} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[0.6rem] font-bold uppercase text-[var(--text2)]">
                        {((user.user_metadata?.['full_name'] as string)?.[0]) ?? user.email?.[0] ?? '?'}
                      </span>
                    )}
                  </button>
                  {uiPanel.showUserMenu && (
                    <div
                      className="absolute right-0 top-full z-50 mt-2 w-40 origin-top-right animate-dropdown rounded-xl border border-[var(--app-border)] bg-[var(--navy2)] p-1.5 shadow-xl shadow-[color:var(--shadow-menu)]"
                    >
                      <div className="grid gap-0.5">
                        <span className="truncate px-3 pb-1 pt-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--text2)]">
                          {user.user_metadata?.['full_name'] ?? user.email}
                        </span>
                        <button
                          type="button"
                          onClick={signOut}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[var(--text2)] transition hover:bg-[var(--navy4)] hover:text-[var(--text)]"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setSigningIn(true);
                    await signIn();
                    setSigningIn(false);
                  }}
                  disabled={signingIn}
                  className={`bell-btn ${signingIn ? 'cursor-wait opacity-60' : ''}`}
                  aria-label="Sign in with Discord"
                >
                  {signingIn ? (
                    <svg className="h-3.5 w-3.5 animate-spin text-[var(--gold2)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.942 5.94a16.3 16.3 0 0 0-6.938-2.127 16.3 16.3 0 0 0-6.936 2.127c-1.777 1.418-3.718 4.555-3.718 9.133 0 .083.001.165.003.247A15.3 15.3 0 0 0 7.78 20.62a12 12 0 0 0 .806-1.297 10.7 10.7 0 0 1-.78-.374 10.4 10.4 0 0 0 .972-.663c2.576 1.437 5.382 1.437 7.996 0a10.4 10.4 0 0 0 .972.663 11 11 0 0 1-.78.374 12 12 0 0 0 .806 1.297 15.3 15.3 0 0 0 3.224-5.135c.002-.082.003-.164.003-.247 0-4.578-1.941-7.715-3.718-9.133m-9.133 7.317c-.816 0-1.466-.726-1.466-1.622s.633-1.622 1.466-1.622 1.483.726 1.483 1.622-.65 1.622-1.483 1.622m4.687 0c-.816 0-1.466-.726-1.466-1.622s.633-1.622 1.466-1.622 1.483.726 1.483 1.622-.65 1.622-1.483 1.622" />
                    </svg>
                  )}
                </button>
              )}
              {authError && (
                <div className="absolute -bottom-1 left-1/2 z-50 mt-1 w-max max-w-48 -translate-x-1/2 translate-y-full rounded-lg border border-[var(--c-red)]/30 bg-[var(--navy2)] px-2.5 py-1 text-[0.6rem] font-medium text-[var(--c-red)] shadow-lg">
                  {authError}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_NOTIFICATIONS' })}
                className={`bell-btn ${bellRing ? 'bell-ring' : ''}`}
                aria-label="Notifications"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && <span className="bell-dot" />}
              </button>
              {uiPanel.showNotifications && <NotificationDropdown onClose={() => dispatch({ type: 'CLOSE_ALL' })} />}
            </div>

            <ThemeToggle theme={theme} onToggle={() => setTheme(current => (current === 'dark' ? 'light' : 'dark'))} />
          </div>
        </div>
      </header>

      <TickerBar />

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-0 pb-28 pt-4 sm:pb-10">
        <div className="animate-soft-rise">
          <Outlet />
        </div>
      </main>

      <MobileNavDrawer
        showMobileOverflow={uiPanel.showMobileOverflow}
        onCloseMobile={handleCloseMobile}
        onOpenMobileGroup={handleOpenMobileGroup}
      />
    </div>
  );
}
