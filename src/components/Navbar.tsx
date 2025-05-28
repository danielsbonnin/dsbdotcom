import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Daniel Bonnin
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-blue-200">Home</Link>
          <Link href="/about" className="hover:text-blue-200">About Me</Link>
          <Link href="/portfolio" className="hover:text-blue-200">Portfolio</Link>
          <Link href="/experience" className="hover:text-blue-200">Experience</Link>
          <Link href="/contact" className="hover:text-blue-200">Contact</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
