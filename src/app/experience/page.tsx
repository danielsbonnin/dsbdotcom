export const metadata = {
  title: "Experience - Daniel Bonnin",
  description: "Explore Daniel Bonnin's work experience, education, and download his resume.",
};

// Placeholder data - replace with actual experience and education
const experiences = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "Tech Solutions Inc.",
    period: "2020 - Present",
    description: "Led a team of developers in creating scalable web applications. Specialized in full-stack development with a focus on AI integration.",
    isEducation: false,
  },
  {
    id: 2,
    title: "Software Developer",
    company: "Innovatech Ltd.",
    period: "2018 - 2020",
    description: "Developed and maintained key features for a flagship product, improving performance and user engagement.",
    isEducation: false,
  },
  {
    id: 3,
    title: "M.S. in Computer Science",
    company: "University of Technology", // Or school name
    period: "2016 - 2018",
    description: "Focused on Machine Learning and Distributed Systems. Thesis on novel AI algorithms.",
    isEducation: true,
  },
  {
    id: 4,
    title: "B.S. in Software Engineering",
    company: "State College", // Or school name
    period: "2012 - 2016",
    description: "Graduated with honors. Active in coding clubs and hackathons.",
    isEducation: true,
  },
];

const ExperiencePage = () => {
  return (
    <div className="py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-professional-blue">My Journey</h1>
        <p className="text-lg text-gray-700 mt-2 max-w-xl mx-auto">
          A timeline of my professional experience and educational background.
        </p>
      </section>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-semibold text-professional-blue mb-6">Work Experience</h2>        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {experiences.filter(exp => !exp.isEducation).map((exp) => (
            <div key={exp.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                {/* Icon placeholder or number */}
                <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="10"><path fillRule="nonzero" d="M10.422 1.257 4.655 7.025 2.553 4.923A.916.916 0 0 0 1.257 6.22l2.75 2.75a.916.916 0 0 0 1.296 0l6.415-6.416a.916.916 0 0 0-1.296-1.296Z" /></svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <h3 className="font-bold text-xl text-professional-blue">{exp.title}</h3>
                  <time className="font-caveat font-medium text-vibrant-accent">{exp.period}</time>
                </div>
                <div className="text-slate-500 font-semibold mb-2">{exp.company}</div>
                <div className="text-gray-600 text-sm">{exp.description}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-semibold text-professional-blue mt-16 mb-6">Education</h2>        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {experiences.filter(exp => exp.isEducation).map((exp) => (
            <div key={exp.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                {/* Icon placeholder or number */}
                <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="10"><path fillRule="nonzero" d="M10.422 1.257 4.655 7.025 2.553 4.923A.916.916 0 0 0 1.257 6.22l2.75 2.75a.916.916 0 0 0 1.296 0l6.415-6.416a.916.916 0 0 0-1.296-1.296Z" /></svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <h3 className="font-bold text-xl text-professional-blue">{exp.title}</h3>
                  <time className="font-caveat font-medium text-vibrant-accent">{exp.period}</time>
                </div>
                <div className="text-slate-500 font-semibold mb-2">{exp.company}</div>
                <div className="text-gray-600 text-sm">{exp.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="text-center mt-16">
        <a
          href="/documents/resume-placeholder.pdf" // Placeholder - replace with actual resume path in /public/documents
          download
          className="bg-professional-blue hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Download Resume (PDF)
        </a>
        {/* Add a placeholder PDF resume to /public/documents/resume-placeholder.pdf */}
      </section>
    </div>
  );
};

export default ExperiencePage;
