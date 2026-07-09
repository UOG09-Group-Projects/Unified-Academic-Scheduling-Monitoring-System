import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, BookOpen, Users,
  GraduationCap, Layers3, Settings, User, LogOut,
  FileText, CreditCard, TrendingUp, Menu, X,
} from 'lucide-react';
import logo from '../assets/logoll.png';

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { label: 'Dashboard',     path: '/dashboard/super-admin' },
    { label: 'Institutions',  path: '/institutions' },
    { label: 'Reports',       path: '/reports' },
    { label: 'Settings',      path: '/superadmin/settings' },
    { label: 'Profile',       path: '/superadmin/profile' },
    { label: 'Subscriptions', path: '/subscriptions' },
  ],
  OWNER: [
    { label: 'Dashboard',    path: '/dashboard/manager' },
    { label: 'Managers',      path: '/managers' },
    //{ label: 'Educators',    path: '/educators' },
    //{ label: 'Students',     path: '/students' },
    //{ label: 'Batches',      path: '/batches' },
    { label: 'Profile',      path: '/profile' },
  ],
  MANAGER: [
    { label: 'Dashboard', path: '/dashboard/manager' },
    { label: 'Courses',   path: '/courses' },
    { label: 'Educators', path: '/educators' },
    //{ label: 'Students',  path: '/students' },
    { label: 'Batches',   path: '/batches' },
    { label: 'Profile',   path: '/profile' },
  ],
  EDUCATOR: [
    { label: 'Dashboard',  path: '/dashboard/educator' },
    { label: 'My Courses', path: '/courses' },
    { label: 'Schedule',   path: '/schedule' },
    { label: 'Profile',    path: '/profile' },
  ],
  STUDENT: [
    { label: 'Dashboard',  path: '/dashboard/student' },
    { label: 'My Courses', path: '/mycourses' },
    { label: 'Schedule',   path: '/schedule' },
    { label: 'Profile',    path: '/profile' },
  ],
  PARENT: [
    { label: 'Dashboard', path: '/dashboard/parent' },
    { label: 'Profile',   path: '/profile' },
    { label: 'Progress',  path: '/progress' },
  ],
};

const ROLE_BADGE = {
  SUPER_ADMIN: 'bg-red-500/10 text-red-400',
  OWNER:       'bg-yellow-500/10 text-yellow-400',
  MANAGER:     'bg-[#395886]/20 text-[#8AAEE0]',
  EDUCATOR:    'bg-green-500/10 text-green-400',
  STUDENT:     'bg-purple-500/10 text-purple-400',
  PARENT:      'bg-pink-500/10 text-pink-400',
};

const ICONS = {
  Dashboard:     LayoutDashboard,
  Institutions:  Building2,
  Courses:       BookOpen,
  'My Courses':  BookOpen,
  Educators:     Users,
  Students:      GraduationCap,
  Batches:       Layers3,
  Reports:       FileText,
  Settings:      Settings,
  Profile:       User,
  Subscriptions: CreditCard,
  Progress:      TrendingUp,
  Schedule:      LayoutDashboard,
};

// Items that appear below a divider
const SECONDARY = new Set(['Profile', 'Settings', 'Subscriptions']);

function SidebarContent({ onClose }) {

  const navigate = useNavigate();


  const user = JSON.parse(
    localStorage.getItem("user")
  );


  const items = [
    { label: 'Dashboard', path: '/dashboard/manager' },
    { label: 'Courses',   path: '/courses' },
    { label: 'Educators', path: '/educators' },
    //{ label: 'Students',  path: '/students' },
    { label: 'Batches',   path: '/batches' },
    { label: 'Profile',   path: '/profile' }
  ];


  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "GU";

  const primaryItems   = items.filter(i => !SECONDARY.has(i.label));
  const secondaryItems = items.filter(i => SECONDARY.has(i.label));

 

  return (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="flex items-center justify-between gap-3
                      border-b border-[#1E2130] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A1D26] border border-[#2A2D3A]
                          flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={logo} alt="LightLearn" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="text-white text-[13px] font-semibold leading-none mb-1">
              LightLearn
            </h1>
            <p className="text-[10px] text-[#4B5563] leading-none mb-2">
              Academic Scheduling
            </p>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg bg-[#1A1D26] flex items-center
                       justify-center text-[#6B7280] hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="text-[9px] font-semibold text-[#374151] uppercase
                      tracking-widest px-2 mb-2">
          Menu
        </p>

        {primaryItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px]
               font-medium transition-all duration-150 relative mb-0.5
               ${isActive
                 ? 'bg-[#395886] text-white'
                 : 'text-[#9CA3AF] hover:bg-[#1A1D26] hover:text-[#F0F2F8]'
               }`
            }
          >
            {({ isActive }) => {
              const Icon = ICONS[item.label] || LayoutDashboard;
              return (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2
                                     w-0.5 h-4 bg-[#8AAEE0] rounded-full" />
                  )}
                  <Icon size={15} className={`shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-[#6B7280] group-hover:text-[#F0F2F8]'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </>
              );
            }}
          </NavLink>
        ))}

        {secondaryItems.length > 0 && (
          <>
            <div className="h-px bg-[#1E2130] my-2 mx-1" />
            {secondaryItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px]
                   font-medium transition-all duration-150 relative mb-0.5
                   ${isActive
                     ? 'bg-[#395886] text-white'
                     : 'text-[#9CA3AF] hover:bg-[#1A1D26] hover:text-[#F0F2F8]'
                   }`
                }
              >
                {({ isActive }) => {
                  const Icon = ICONS[item.label] || LayoutDashboard;
                  return (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2
                                         w-0.5 h-4 bg-[#8AAEE0] rounded-full" />
                      )}
                      <Icon size={15} className={`shrink-0 ${
                        isActive ? 'text-white' : 'text-[#6B7280] group-hover:text-[#F0F2F8]'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </>
                  );
                }}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1E2130] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#395886]/20 border border-[#395886]/30
                          flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#8AAEE0]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#9CA3AF] truncate">
              {user?.email}
            </p>
            <button
              //onClick={handleLogout}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors
                         flex items-center gap-1 mt-0.5 bg-transparent border-none p-0
                         cursor-pointer"
            >
              <LogOut size={11} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile topbar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14
                      bg-[#0F1117] border-b border-[#1E2130]
                      flex items-center justify-between px-4">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-lg bg-[#1A1D26] flex items-center justify-center
                     text-[#9CA3AF] hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>
        <span className="text-white text-[13px] font-semibold">LightLearn</span>
        <div className="w-8" /> {/* spacer */}
      </div>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside className={`
        md:hidden fixed top-0 left-0 z-50 h-screen w-64
        bg-[#0F1117] border-r border-[#1E2130]
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent onClose={() => setOpen(false)} />
      </aside>

      {/* ── Desktop sidebar (always visible) ── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 z-50
                        h-screen w-64 bg-[#0F1117] border-r border-[#1E2130]">
        <SidebarContent />
      </aside>
    </>
  );
}