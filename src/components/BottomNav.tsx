'use client';

import { Home, PlusCircle, Map, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'בית', icon: Home },
  { href: '/trip/new', label: 'טיול חדש', icon: PlusCircle },
  { href: '/#trips', label: 'הטיולים שלי', icon: Map },
  { href: '/#chat', label: 'צ\'אט AI', icon: MessageCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-card-border safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href === '/trip/new' && pathname.startsWith('/trip/new'));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
