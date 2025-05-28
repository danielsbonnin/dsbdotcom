"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(false);
    setError(null);
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.");
      return;
    }
    // Add your form submission logic here (e.g., send to an API endpoint)
    // For this example, we'll just simulate a successful submission.
    console.log("Form data submitted:", formData);
    // Replace with actual API call
    // try {
    //   const response = await fetch('/api/contact', { // Example API endpoint
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(formData),
    //   });
    //   if (response.ok) {
    //     setIsSubmitted(true);
    //     setFormData({ name: '', email: '', message: '' });
    //   } else {
    //     setError('Failed to send message. Please try again.');
    //   }
    // } catch (err) {
    //   setError('An error occurred. Please try again.');
    // }
    setIsSubmitted(true); // Simulate success
    setFormData({ name: '', email: '', message: '' }); // Reset form
  };

  return (
    <div className="py-8">
      <section className="text-center mb-12">        <h1 className="text-4xl font-bold text-professional-blue">Get In Touch</h1>
        <p className="text-lg text-gray-700 mt-2 max-w-xl mx-auto">
          I&rsquo;m always open to discussing new projects, creative ideas, or opportunities to be part of something great. Feel free to reach out!
        </p>
      </section>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        {isSubmitted && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 border border-green-300 rounded-md">
            Thank you for your message! I&rsquo;ll get back to you soon.
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-vibrant-accent focus:border-vibrant-accent sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-vibrant-accent focus:border-vibrant-accent sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              name="message"
              id="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-vibrant-accent focus:border-vibrant-accent sm:text-sm"
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-professional-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-professional-blue transition duration-150 ease-in-out"
            >
              Send Message
            </button>
          </div>
        </form>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-professional-blue mb-3">You can also reach me at:</h3>
          <p className="text-gray-700 mb-2">
            Email: <a href="mailto:your.email@example.com" className="text-vibrant-accent hover:underline">your.email@example.com</a> {/* Replace with actual email */}
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <Link href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-professional-blue"> {/* LinkedIn URL */}
              {/* Placeholder for LinkedIn Icon - consider react-icons */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
            </Link>
            <Link href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-professional-blue"> {/* GitHub URL */}
              {/* Placeholder for GitHub Icon */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.009-.865-.014-1.695-2.782.602-3.369-1.34-3.369-1.34-.455-1.158-1.11-1.468-1.11-1.468-.908-.62.069-.608.069-.608 1.004.074 1.532 1.03 1.532 1.03.891 1.529 2.341 1.089 2.91.833.091-.647.349-1.086.635-1.335-2.22-.251-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.029-2.682-.103-.252-.446-1.27.098-2.645 0 0 .84-.269 2.75 1.025A9.548 9.548 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.748-1.025 2.748-1.025.546 1.375.203 2.393.1 2.645.64.702 1.027 1.595 1.027 2.682 0 3.842-2.338 4.688-4.565 4.935.358.307.679.917.679 1.852 0 1.335-.012 2.415-.012 2.741 0 .268.18.577.688.479C19.138 20.162 22 16.419 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg>
            </Link>
            {/* Add other social/professional links as needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
