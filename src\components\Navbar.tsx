import React, { useState } from 'react';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`bg-gray-800 p-4 ${className || ''} `}>
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="text-white text-2xl font-bold">
          DanielsBonnin.com
        </a>
        <div className="hidden md:flex space-x-6">
          <a href="/" className="text-white hover:text-gray-300">Home</a>
          <a href="/about" className="text-white hover:text-gray-300">About</a>
          <a href="/projects" className="text-white hover:text-gray-300">Projects</a>
          <a href="/contact" className="text-white hover:text-gray-300">Contact</a>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Toggle Navigation"
          aria-expanded={mobileMenuOpen}
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
        className={`md:hidden absolute top-12 right-4 bg-gray-800 p-4 rounded-md shadow-lg transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <ul className="text-white space-y-2">
          <li><a href="/" className="block hover:text-gray-300">Home</a></li>
          <li><a href="/about" className="block hover:text-gray-300">About</a></li>
          <li><a href="/projects" className="block hover:text-gray-300">Projects</a></li>
          <li><a href="/contact" className="block hover:text-gray-300">Contact</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;