
import PolicyLayout from "./PolicyLayout";
import { policies } from "./data/footerSectionData";

const ShippingPolicy = () => {
  const shippingPolicy = policies.shipping;

  return (
    <PolicyLayout title="Shipping Policy">
      {shippingPolicy.sections.map((section, index) => (
        <section key={index} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {`${index + 1}. ${section.title}`}
          </h2>
          <p className="text-gray-600 mb-4">{section.content}</p>

          {section.listItems && (
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              {section.listItems.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          )}

          {section.subsections?.map((subsection, subIndex) => (
            <div key={subIndex}>
              <p className="text-gray-600 mb-4">{subsection.content}</p>
            </div>
          ))}
        </section>
      ))}

      <div className="text-sm text-gray-500 mt-8">
        Last Updated: {shippingPolicy.lastUpdated}
      </div>
    </PolicyLayout>
  );
};

export default ShippingPolicy;