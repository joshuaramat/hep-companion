import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full btn-gradient text-white">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
          <div>
            <h3 className="text-lg font-bold mb-4">HEP Companion</h3>
            <p className="text-sm text-cyan-100">
              Your AI-powered exercise companion, helping you achieve your health and fitness goals through evidence-based physical therapy practices.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="nav-link">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/suggestions" className="nav-link">
                  Exercise Suggestions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Disclaimer</h3>
            <p className="text-sm text-cyan-100">
              This tool is for informational purposes only. Always consult with your healthcare provider before starting any exercise program.
            </p>
          </div>
        </div>
        <div className="border-t border-cyan-500/30 py-6 text-center">
          <p className="text-sm text-cyan-100">
            Copyright {new Date().getFullYear()} HEP Companion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 