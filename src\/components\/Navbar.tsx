import Link from 'next\/link';

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  return (
    <nav className="bg-primary text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          DanielsBonnin.com
        </Link>
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="hover:text-secondary">Home</Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-secondary">About</Link>
          </li>
          <li>
            <Link href="/projects" className="hover:text-secondary">Projects</Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-secondary">Contact</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
