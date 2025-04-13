
import PolicyLayout from "./PolicyLayout";

const ShippingPolicy = () => {
  return (
    <PolicyLayout title="Shipping Policy">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Overview</h2>
        <p className="text-gray-600 mb-4">
          KaamDekho is primarily a job search platform providing digital services. As we do not sell physical goods, this Shipping Policy applies to 
          any promotional materials, documents, or other physical items that may occasionally be sent to users.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Processing Time</h2>
        <p className="text-gray-600 mb-4">
          For any physical materials that need to be shipped:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Orders are typically processed within 1-2 business days</li>
          <li>Processing may take longer during peak periods or promotions</li>
          <li>You will receive a confirmation email with tracking information once your package has been shipped</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Shipping Options</h2>
        <p className="text-gray-600 mb-4">
          We currently offer the following shipping methods:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Standard Shipping (5-7 business days)</li>
          <li>Express Shipping (2-3 business days)</li>
          <li>International Shipping (7-14 business days)</li>
        </ul>
        <p className="text-gray-600 mb-4">
          Shipping costs, if any, will be calculated and displayed at checkout.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Delivery Information</h2>
        <p className="text-gray-600 mb-4">
          Please note the following regarding deliveries:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Delivery times are estimates and are not guaranteed</li>
          <li>Delivery delays can occasionally occur due to circumstances beyond our control</li>
          <li>We are not responsible for any customs duties or taxes that may apply to international shipments</li>
          <li>A signature may be required upon delivery for certain items</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Tracking Your Order</h2>
        <p className="text-gray-600 mb-4">
          Once your package has been shipped, you will receive a confirmation email with tracking information.
          You can track your order by:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Clicking on the tracking link in your shipping confirmation email</li>
          <li>Logging into your KaamDekho account and viewing your order history</li>
          <li>Contacting our customer support with your order number</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Lost or Damaged Shipments</h2>
        <p className="text-gray-600 mb-4">
          In the rare event that your shipment is lost or damaged:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Please contact our customer support team within 7 days of the expected delivery date</li>
          <li>Provide your order number and a description of the issue</li>
          <li>We will investigate the matter and work to resolve it promptly</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact Information</h2>
        <p className="text-gray-600 mb-4">
          If you have any questions about our shipping policy, please contact us at:
        </p>
        <p className="text-gray-600">
          Email: shipping@kaamdekho.com<br />
          Phone: +91 1234567890<br />
          Hours of Operation: Monday to Friday, 9:00 AM to 6:00 PM IST
        </p>
      </section>

      <div className="text-sm text-gray-500 mt-8">
        Last Updated: April 13, 2025
      </div>
    </PolicyLayout>
  );
};

export default ShippingPolicy;