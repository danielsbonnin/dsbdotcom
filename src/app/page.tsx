import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Page = () => {
  return (
    <>
      <Navbar />      <main className="container mx-auto p-8 mt-20">
        <section className="bg-neutral-100 p-8 rounded-lg shadow-md border border-neutral-200">
          <h1 className="text-3xl font-bold mb-4 text-neutral-900">Welcome to my Portfolio!</h1>
          <p className="text-neutral-700 mb-4">This is a brief description of myself and my work.</p>
          <button className="bg-professional-blue hover:bg-professional-blue-dark text-white font-bold py-2 px-4 rounded transition-colors duration-200">
            Learn More
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Page;