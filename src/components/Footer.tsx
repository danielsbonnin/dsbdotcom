const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (    <footer className="bg-neutral-900 text-neutral-200 p-4 text-center border-t border-neutral-800">
      <p>&copy; {currentYear} Daniels Bonnin. All rights reserved.</p>
    </footer>
  );
};

export default Footer;