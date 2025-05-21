"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import Image from "next/image";
import dynamic from 'next/dynamic';

const SimulatorStatus = dynamic(() => import('./simulator/components/simulator-status'), {
  ssr: false
});
export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
      <Link href="/" className="font-semibold text-lg tracking-tight">
      <Image
                  src="/logo.svg"
                  alt="Home"
                  width={80}
                  height={24}
                  className="dark:invert"
                />
      </Link>
      <nav className="flex gap-4">
        <Link
          className={`rounded-full border border-solid transition-colors flex items-center justify-center ${
            pathname === '/dashboard' 
            ? 'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] border-transparent' 
            : 'border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent'
          } text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5`}
          href="/dashboard"
        >
          Sensor Map
        </Link>
        <Link
          className={`rounded-full border border-solid transition-colors flex items-center justify-center ${
            pathname === '/simulator'
            ? 'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] border-transparent' 
            : 'border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent'
          } text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5`}
          href="/simulator"
        >
          <span className="mr-4">Simulator</span>
          <SimulatorStatus />
        </Link>
      </nav>
    </div>
  );
}