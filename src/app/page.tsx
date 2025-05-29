import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Page = () => {
  return (
    <>
      <Navbar />
      <main className="container mx-auto p-8 mt-20">
        <section className="bg-gray-100 p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome to my Portfolio!</h1>
          <p className="text-gray-700 mb-4">This is a brief description of myself and my work.</p>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Learn More
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Page;