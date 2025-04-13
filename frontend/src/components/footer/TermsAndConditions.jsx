import PolicyLayout from "./PolicyLayout";

const TermsAndConditions = () => {
  return (
    <PolicyLayout title="Terms and Conditions">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
        <p className="text-gray-600 mb-4">
          Welcome to KaamDekho! These Terms and Conditions govern your use of our website and services.
          By accessing or using KaamDekho, you agree to be bound by these Terms.
        </p>
        <p className="text-gray-600 mb-4">
          Please read these Terms carefully before using our platform. If you do not agree with any part of these Terms,
          you may not access or use our website or services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Definitions</h2>
        <p className="text-gray-600 mb-4">
          Throughout these Terms, "we," "us," and "our" refer to KaamDekho. "User," "you," and "your" refer to the 
          individual accessing or using KaamDekho.
        </p>
        <p className="text-gray-600 mb-4">
          "Content" refers to all information, text, graphics, photos, videos, data, or other materials that 
          are uploaded, downloaded, or displayed on the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Account Registration</h2>
        <p className="text-gray-600 mb-4">
          Some features of KaamDekho may require you to create an account. You agree to provide accurate, current, and complete information
          during the registration process and to update such information to keep it accurate, current, and complete.
        </p>
        <p className="text-gray-600 mb-4">
          You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us 
          immediately of any unauthorized use of your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. User Conduct</h2>
        <p className="text-gray-600 mb-4">
          You agree not to use KaamDekho:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>For any unlawful purpose or to engage in illegal activities</li>
          <li>To harass, abuse, or harm another person</li>
          <li>To impersonate or misrepresent your affiliation with any person or entity</li>
          <li>To interfere with or circumvent the security features of the platform</li>
          <li>To engage in any activity that could damage, disable, or impair the functioning of KaamDekho</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Limitation of Liability</h2>
        <p className="text-gray-600 mb-4">
          To the maximum extent permitted by applicable law, KaamDekho shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly,
          or any loss of data, use, goodwill, or other intangible losses.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Changes to Terms</h2>
        <p className="text-gray-600 mb-4">
          We may modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page
          with a new effective date. Your continued use of KaamDekho after any such changes constitutes your acceptance of the new Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact Information</h2>
        <p className="text-gray-600 mb-4">
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="text-gray-600">
          Email: support@kaamdekho.com<br />
          Address: KaamDekho Headquarters, 123 Business Street, Tech City, 400001
        </p>
      </section>

      <div className="text-sm text-gray-500 mt-8">
        Last Updated: April 13, 2025
      </div>
    </PolicyLayout>
  );
};

export default TermsAndConditions;