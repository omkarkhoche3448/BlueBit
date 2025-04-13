
import PolicyLayout from "./PolicyLayout";

const PrivacyPolicy = () => {
  return (
    <PolicyLayout title="Privacy Policy">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
        <p className="text-gray-600 mb-4">
          At KaamDekho, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you visit our website or use our services.
        </p>
        <p className="text-gray-600 mb-4">
          Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
        
        <h3 className="text-xl font-medium text-gray-800 mb-2">2.1. Personal Data</h3>
        <p className="text-gray-600 mb-4">
          We may collect personal identification information from Users in various ways, including, but not limited to, when Users:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Register on our site</li>
          <li>Subscribe to our newsletter</li>
          <li>Respond to a survey</li>
          <li>Fill out a form</li>
          <li>Apply for job opportunities</li>
        </ul>
        
        <h3 className="text-xl font-medium text-gray-800 mb-2">2.2. Non-personal Data</h3>
        <p className="text-gray-600 mb-4">
          We may collect non-personal identification information about Users whenever they interact with our site. This may include:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Browser name</li>
          <li>Type of device</li>
          <li>Technical information about Users' connection to our site</li>
          <li>Search queries and preferences</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
        <p className="text-gray-600 mb-4">
          We may use the information we collect from you for the following purposes:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>To personalize your experience on our site</li>
          <li>To improve our website and services</li>
          <li>To send periodic emails regarding your job applications or other services</li>
          <li>To match you with relevant job opportunities</li>
          <li>To process transactions</li>
          <li>To administer promotions, surveys, or other site features</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Protection of Your Information</h2>
        <p className="text-gray-600 mb-4">
          We adopt appropriate data collection, storage, and processing practices and security measures to protect against
          unauthorized access, alteration, disclosure, or destruction of your personal information, username, password,
          transaction information, and data stored on our site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Sharing Your Personal Information</h2>
        <p className="text-gray-600 mb-4">
          We do not sell, trade, or rent Users' personal identification information to others. We may share generic aggregated demographic 
          information not linked to any personal identification information regarding visitors and users with our business partners, 
          trusted affiliates, and advertisers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Cookies</h2>
        <p className="text-gray-600 mb-4">
          Our site may use "cookies" to enhance User experience. Users may choose to set their web browser to refuse cookies or to alert 
          you when cookies are being sent. If they do so, note that some parts of the site may not function properly.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Changes to This Privacy Policy</h2>
        <p className="text-gray-600 mb-4">
          KaamDekho has the discretion to update this privacy policy at any time. We encourage Users to frequently check this page
          for any changes. You acknowledge and agree that it is your responsibility to review this privacy policy periodically and
          become aware of modifications.
        </p>
      </section>

      <div className="text-sm text-gray-500 mt-8">
        Last Updated: April 13, 2025
      </div>
    </PolicyLayout>
  );
};

export default PrivacyPolicy;