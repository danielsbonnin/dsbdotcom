const Footer = () => {
  return (
    <footer className="bg-primary text-white p-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Daniels Bonnin. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
