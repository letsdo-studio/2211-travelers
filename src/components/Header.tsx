'use client';

import { MapPin, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function Header({ title, showBack, backHref = '/' }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-card-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href={backHref}
              className="p-2 -m-2 rounded-xl hover:bg-primary/10 transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-primary" />
            </Link>
          )}
          {isHome ? (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-l from-primary to-purple-500 bg-clip-text text-transparent">
                TripAI
              </span>
            </Link>
          ) : (
            <h1 className="text-lg font-bold">{title}</h1>
          )}
        </div>

        <Link
          href="/settings"
          className="p-2 -m-2 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <Settings className="w-5 h-5 text-muted" />
        </Link>
      </div>
    </header>
  );
}
