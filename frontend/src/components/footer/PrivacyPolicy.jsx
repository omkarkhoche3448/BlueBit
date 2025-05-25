
import PolicyLayout from "./PolicyLayout";
import { policies } from "./data/footerSectionData";

const PrivacyPolicy = () => {
  const privacyPolicy = policies.privacy;

  return (
    <PolicyLayout title="Privacy Policy">
      {privacyPolicy.sections.map((section, index) => (
        <section key={index} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {`${index + 1}. ${section.title}`}
          </h2>
          <p className="text-gray-600 mb-4">{section.content}</p>

          {section.subsections?.map((subsection, subIndex) => (
            <div key={subIndex} className="mt-6">
              {subsection.title && (
                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  {`${index + 1}.${subIndex + 1}. ${subsection.title}`}
                </h3>
              )}
              <p className="text-gray-600 mb-4">{subsection.content}</p>
              {subsection.listItems && (
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  {subsection.listItems.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      ))}
    </PolicyLayout>
  );
};

export default PrivacyPolicy;