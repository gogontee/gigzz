import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  LogOut,
  Briefcase,
  Layers,
  Edit3,
  Settings,
  Home,
  Coins,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function ApplicantLayout({ children }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-black text-white flex flex-col p-4 space-y-6 transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
          fixed md:static z-50 h-screen`}
      >
        {/* Toggle Button (only visible on mobile) */}
        <button
          className="md:hidden self-end text-white mb-4"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>

        {/* Logo */}
        {!collapsed && (
          <img
            src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars//gigzzwhite.png"
            alt="Gigzz Logo"
            className="h-10 object-contain"
          />
        )}

        {/* Navigation */}
        <nav className="space-y-4">
          <SidebarLink href="/dashboard/applicant" icon={<Home size={20} />} label="Dashboard" collapsed={collapsed} />
          <SidebarLink href="/profile" icon={<User size={20} />} label="My Profile" collapsed={collapsed} />
          <SidebarLink href="/dashboard/applicant/portfolio" icon={<Layers size={20} />} label="Portfolio" collapsed={collapsed} />
          <SidebarLink href="/dashboard/applicant/applications" icon={<Briefcase size={20} />} label="Applications" collapsed={collapsed} />
          <SidebarLink href="/dashboard/applicant/tokens" icon={<Coins size={20} />} label="Tokens" collapsed={collapsed} />
          <SidebarLink href="/dashboard/applicant/settings" icon={<Settings size={20} />} label="Settings" collapsed={collapsed} />
        </nav>

        {/* Logout Button */}
        <button
          className={`mt-auto flex items-center gap-2 hover:text-orange-500 ${
            collapsed ? 'justify-center' : ''
          }`}
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/auth/login');
          }}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-white ml-16 md:ml-0">{children}</main>
    </div>
  );
}

function SidebarLink({ href, icon, label, collapsed }) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        isActive ? 'bg-orange-600' : 'hover:bg-gray-800'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
