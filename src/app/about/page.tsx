import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: "About Daniel Bonnin",
  description: "Learn more about Daniel Bonnin, his skills, experience, and professional philosophy.",
};

const AboutPage = () => {
  return (
    <div className="space-y-12 py-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-professional-blue">About Me</h1>
        <div className="max-w-xl mx-auto mb-8">
          <Image
            src="/images/profile-placeholder.png" // Placeholder - replace with actual path to https://photos.app.goo.gl/9YZbsnmao7PFxYah8 (download and add to public/images)
            alt="Daniel Bonnin"
            width={200}
            height={200}
            className="rounded-full mx-auto shadow-lg mb-6"
          />
        </div>
        <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
          Innovative Software Engineer specializing in Full Stack Development and AI/ML solutions, passionate about building impactful technology and leading dynamic teams.
        </p>
      </section>

      <section id="skills" className="py-12 bg-gray-50 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center mb-8 text-professional-blue">Core Skills & Expertise</h2>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
          {[
            "React", "Node.js", "Python", "AWS", "Agile",
            "Machine Learning", "Mobile Development", "UI/UX Principles",
            "TypeScript", "JavaScript"
          ].map(skill => (
            <li key={skill} className="bg-white p-4 rounded-md shadow-sm text-gray-700 font-medium">{skill}</li>
          ))}
        </ul>
      </section>

      <section className="py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-professional-blue">Key Accomplishments</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-professional-blue mb-2">Led Development of X App</h3>
            <p className="text-gray-700">Resulted in Y% user growth through innovative features and a user-centric approach.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-professional-blue mb-2">Innovated Z Feature for ABC Platform</h3>
            <p className="text-gray-700">Improved system efficiency by Q% by developing and implementing a novel algorithm.</p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center mb-8 text-professional-blue">Personality & Working Style</h2>
        <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto text-center">
          Analytical and results-oriented problem solver with a collaborative spirit. I thrive on tackling complex challenges and enjoy mentoring others. My approach is user-centric and data-driven.
        </p>
      </section>

      <section className="py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-professional-blue">Passions & Interests</h2>
        <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto text-center">
          Deeply interested in the ethical implications of AI, the future of decentralized technologies, and creating accessible user experiences. I also enjoy contributing to open-source projects and exploring generative art.
        </p>
      </section>
      
      <section className="py-8 bg-professional-blue text-white rounded-lg shadow-xl">        <h2 className="text-3xl font-bold text-center mb-6">My Philosophy</h2>
        <p className="text-xl italic leading-relaxed max-w-2xl mx-auto text-center text-blue-100">
          &ldquo;I believe in helping humans get away from what computers are good at to do more of what humans are good at.&rdquo;
        </p>
      </section>

      <section className="text-center py-8">
        <Link href="/contact"
          className="bg-vibrant-accent hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105">
            Let&rsquo;s Work Together
        </Link>
      </section>
    </div>
  );
};

export default AboutPage;
