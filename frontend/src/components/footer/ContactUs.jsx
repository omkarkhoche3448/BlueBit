
import { useState } from "react";
import PolicyLayout from "./PolicyLayout";
import { toast } from "react-hot-toast";
import { Mail, Phone, MapPin } from "lucide-react";
import { companyInfo, contactFormSubjects } from "./data/footerSectionData";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast.success("Thank you! Your message has been sent successfully.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <PolicyLayout title="Contact Us">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <p className="text-gray-600 mb-8">
            Have questions, suggestions, or need assistance? We're here to help!
            Fill out the form below, and our team will get back to you as soon as possible.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <Mail className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-800">Email Us</h3>
                <p className="text-gray-600">{companyInfo.contact.support.email}</p>
                <p className="text-gray-600">For business inquiries: {companyInfo.contact.business.email}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-800">Call Us</h3>
                <p className="text-gray-600">Customer Support: {companyInfo.contact.support.phone}</p>
                <p className="text-gray-600">Hours: {companyInfo.contact.hours}</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-800">Visit Us</h3>
                <p className="text-gray-600">
                  {companyInfo.headquarters.name}<br />
                  {companyInfo.headquarters.address}<br />
                  {companyInfo.headquarters.city}, {companyInfo.headquarters.pincode}<br />
                  {companyInfo.headquarters.country}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a topic</option>
                {contactFormSubjects.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please describe your inquiry in detail..."
              ></textarea>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-6 py-3 text-white font-medium rounded-md ${
                  isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                } transition duration-200 flex items-center justify-center`}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PolicyLayout>
  );
};

export default ContactUs;