import Link from 'next/link';

export default function MainHeader() {
  return (
    <header className="w-full fixed top-0 left-0 right-0 btn-gradient text-white shadow-lg z-50">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold nav-link">
            HEP Companion
          </Link>
        </div>
      </div>
    </header>
  );
} 