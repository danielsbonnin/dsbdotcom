import Link from "next/link";

interface NavbarProps {
  title?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title = "Daniels Bonnin" }) => {
  return (    <nav className="bg-neutral-900 p-4 fixed top-0 w-full z-10 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-xl font-bold hover:text-neutral-200 transition-colors">
          {title}
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link href="/about" className="text-neutral-200 hover:text-white transition-colors duration-200">
            About
          </Link>
          <Link href="/projects" className="text-neutral-200 hover:text-white transition-colors duration-200">
            Projects
          </Link>
          <Link href="/contact" className="text-neutral-200 hover:text-white transition-colors duration-200">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;