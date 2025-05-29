import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: "Portfolio - Daniel Bonnin",
  description: "Explore Daniel Bonnin's projects, showcasing his skills in web development, AI/ML, and more.",
};

// Placeholder data - replace with actual project details
const projects = [
  {
    id: 1,
    title: "Project Alpha",
    description: "A cutting-edge web application that solves a complex industry problem using AI.",
    tags: ["React", "Node.js", "AI", "Machine Learning"],
    features: ["Real-time data processing", "Predictive analytics", "User-friendly interface"],
    liveLink: "#", // Replace with actual link or remove if not available
    repoLink: "#", // Replace with actual link or remove if not available
    imageUrl: "/images/project-alpha-placeholder.png", // Placeholder image
  },
  {
    id: 2,
    title: "Mobile App Beta",
    description: "A cross-platform mobile application designed for seamless user experience.",
    tags: ["React Native", "Firebase", "Mobile Development"],
    features: ["Offline capabilities", "Push notifications", "Intuitive navigation"],
    // liveLink: "#",
    repoLink: "#",
    imageUrl: "/images/project-beta-placeholder.png", // Placeholder image
  },
  {
    id: 3,
    title: "Open Source Contribution Gamma",
    description: "Contributed significantly to a popular open-source library, enhancing its performance.",
    tags: ["Python", "Open Source", "Performance Optimization"],
    features: ["Algorithm optimization", "Community collaboration", "Extensive testing"],
    repoLink: "#",
    imageUrl: "/images/project-gamma-placeholder.png", // Placeholder image
  },
];

const PortfolioPage = () => {
  return (
    <div className="py-8">
      <section className="text-center mb-12">        <h1 className="text-4xl font-bold text-professional-blue">My Portfolio</h1>
        <p className="text-lg text-neutral-700 mt-2 max-w-xl mx-auto">
          Here are some of the projects I&rsquo;ve worked on. Each one represents a unique challenge and an opportunity to learn and grow.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col">
            <div className="relative h-48 w-full">
              {/* Placeholder for project image - consider Next/Image if optimizing many images */}
              <Image src={project.imageUrl} alt={project.title} width={400} height={200} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-2xl font-semibold text-professional-blue mb-2">{project.title}</h2>
              <div className="mb-3">
                {project.tags.map(tag => (
                  <span key={tag} className="inline-block bg-blue-100 text-professional-blue text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>              <p className="text-neutral-700 mb-4 text-sm flex-grow">{project.description}</p>
              <div>
                <h4 className="font-semibold text-neutral-800 mb-1">Key Features:</h4>
                <ul className="list-disc list-inside text-neutral-700 text-sm mb-4">
                  {project.features.map(feature => <li key={feature}>{feature}</li>)}
                </ul>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-200">
                {project.liveLink && (
                  <Link href={project.liveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vibrant-accent hover:text-orange-700 font-semibold mr-4 transition duration-300">
                      View Live Project
                  </Link>
                )}
                {project.repoLink && (
                  <Link href={project.repoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 hover:text-professional-blue font-semibold transition duration-300">
                      View Repository
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Add placeholder images to /public/images/project-alpha-placeholder.png, etc. */}
    </div>
  );
};

export default PortfolioPage;
