import Link from 'next/link';

interface HeaderProps {
  progress: number;
  total: number;
  error?: string;
  isSubmitted?: boolean;
}

export default function Header({ progress, total, error, isSubmitted }: HeaderProps) {
  return (
    <header className="w-full fixed top-0 left-0 right-0 btn-gradient text-white shadow-lg z-50">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold nav-link">
            HEP Companion
          </Link>
          <div className="flex items-center space-x-6">
            {!isSubmitted && (
              <div className="flex items-center space-x-4">
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${(progress / total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {progress}/{total} rated
                </span>
              </div>
            )}
            <Link 
              href="/" 
              className="nav-link flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Input
            </Link>
          </div>
        </div>
        {error && (
          <div className="absolute top-16 left-0 right-0 bg-red-50 text-red-700 text-sm font-medium py-2 px-4">
            {error}
          </div>
        )}
      </div>
    </header>
  );
} 