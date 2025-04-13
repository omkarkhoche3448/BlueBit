
import PolicyLayout from "./PolicyLayout";

const Refunds = () => {
  return (
    <PolicyLayout title="Cancellation and Refunds">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Cancellation Policy</h2>
        <p className="text-gray-600 mb-4">
          At KaamDekho, we understand that circumstances change. This policy outlines the conditions and procedures for cancellations
          of our premium services and subscriptions.
        </p>

        <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">1.1. Free Services</h3>
        <p className="text-gray-600 mb-4">
          You may cancel your free account at any time without incurring any charges or penalties.
        </p>

        <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">1.2. Premium Subscriptions</h3>
        <p className="text-gray-600 mb-4">
          For premium subscriptions:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Monthly subscriptions can be cancelled at any time. The cancellation will take effect at the end of the current billing cycle.</li>
          <li>Annual subscriptions can be cancelled within 14 days of purchase for a full refund. After this period, cancellations will take effect at the end of the subscription period.</li>
          <li>No partial refunds will be provided for unused periods of service unless otherwise specified.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How to Cancel</h2>
        <p className="text-gray-600 mb-4">
          To cancel your subscription or service:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Log in to your KaamDekho account</li>
          <li>Navigate to "Account Settings" {">"} "Subscriptions"</li>
          <li>Click on "Cancel Subscription" and follow the prompts</li>
          <li>Alternatively, contact our customer support team for assistance</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Refund Policy</h2> className="text-2xl font-semibold text-
        <p className="text-gray-600 mb-4">
          KaamDekho strives to provide high-quality services. However, we understand that there may be instances where a refund is warranted.
        </p>

        <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">3.1. Eligibility for Refunds</h3>
        <p className="text-gray-600 mb-4">
          You may be eligible for a refund under the following circumstances:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Technical issues that significantly impair the functionality of our premium services</li>
          <li>Duplicate charges or billing errors</li>
          <li>Cancellation within the cooling-off period (14 days from purchase) for annual subscriptions</li>
          <li>Non-delivery of promised services or features</li>
        </ul>
        
        <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">3.2. Refund Process</h3>
        <p className="text-gray-600 mb-4">
          To request a refund:
        </p>
        <ol className="list-decimal pl-6 text-gray-600 mb-4">
          <li>Contact our customer support team with your request</li>
          <li>Provide your account details and the reason for the refund request</li>
          <li>Our team will review your request and respond within 3-5 business days</li>
          <li>If approved, refunds will be processed to the original payment method used</li>
        </ol>
        <p className="text-gray-600 mb-4">
          Please note that refund processing times may vary depending on your payment provider, typically taking 5-10 business days to appear in your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Non-Refundable Items</h2>
        <p className="text-gray-600 mb-4">
          The following are generally not eligible for refunds:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Premium services that have been used substantially</li>
          <li>Cancellations after the 14-day cooling-off period for annual subscriptions</li>
          <li>Service fees for specialized job postings or featured listings</li>
          <li>Any additional services purchased separately from subscription plans</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Special Circumstances</h2>
        <p className="text-gray-600 mb-4">
          We understand that exceptional circumstances may arise. In such cases, refund requests will be evaluated on a case-by-case basis.
          Please contact our customer support team with detailed information about your situation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Contact Information</h2>
        <p className="text-gray-600 mb-4">
          For cancellations, refunds, or related inquiries, please contact our customer support team:
        </p>
        <p className="text-gray-600">
          Email: billing@kaamdekho.com<br />
          Phone: +91 1234567890<br />
          Hours: Monday-Friday, 9AM-6PM IST
        </p>
      </section>

      <div className="text-sm text-gray-500 mt-8">
        Last Updated: April 13, 2025
      </div>
    </PolicyLayout>
  );
};

export default Refunds;