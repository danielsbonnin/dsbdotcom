import { useState } from 'react';

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title = 'DanielsBonnin' }: NavbarProps): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-800">
      <div className="container mx-auto px-4 flex justify-between items-center py-4">
        <div className="flex items-center">
          <a href="#" className="text-white text-xl font-bold">{title}</a>
        </div>
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
        <div
          className={`md:flex md:items-center md:space-x-6 md:ml-auto ${mobileMenuOpen ? 'block' : 'hidden'}
          `}
        >
          <a href="#" className="text-white hover:text-gray-300 px-3 py-2 rounded-md md:p-0">Home</a>
          <a href="#" className="text-white hover:text-gray-300 px-3 py-2 rounded-md md:p-0">About</a>
          <a href="#" className="text-white hover:text-gray-300 px-3 py-2 rounded-md md:p-0">Projects</a>
          <a href="#" className="text-white hover:text-gray-300 px-3 py-2 rounded-md md:p-0">Contact</a>
        </div>
      </div>
    </nav>
  );
}