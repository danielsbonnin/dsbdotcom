import ContactForm from '@/components/ContactForm';

const ContactPage = () => {
  const handleSubmit = (data: FormData) => {
    console.log('Form submitted:', Object.fromEntries(data.entries()));
  };

  return (
    <div className="container mx-auto p-8">
      <ContactForm onSubmit={handleSubmit} />
    </div>
  );
};

export default ContactPage;