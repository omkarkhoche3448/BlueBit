import PolicyLayout from "./PolicyLayout";
import { policies } from "./data/footerSectionData";

const TermsAndConditions = () => {
  const terms = policies.terms;

  return (
    <PolicyLayout title="Terms and Conditions">
      {terms.sections.map((section, index) => (
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
        </section>
      ))}
    </PolicyLayout>
  );
};

export default TermsAndConditions;