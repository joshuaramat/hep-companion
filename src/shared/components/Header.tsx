import Link from 'next/link';

interface HeaderProps {
  progress: number;
  total: number;
  error?: string;
}

export default function Header({ progress, total, error }: HeaderProps) {
  return (
    <header className="w-full btn-gradient text-white sticky top-0 z-50">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="nav-link">
            HEP Companion
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/about" className="nav-link">
              About
            </Link>
            <Link href="/contact" className="nav-link">
              Contact
            </Link>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div 
            className="h-full bg-white transition-all duration-700 ease-out"
            style={{ 
              width: `${(progress / total) * 100}%`,
              transform: 'translateZ(0)'
            }}
          />
        </div>
        {error && (
          <div className="absolute bottom-0 right-0 text-red-200 text-sm p-2">
            {error}
          </div>
        )}
      </div>
    </header>
  );
} 