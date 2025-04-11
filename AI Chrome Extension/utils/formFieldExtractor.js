/**
 * Utility for extracting form fields from a webpage
 */
class FormFieldExtractor {
  constructor() {
    this.formFields = [];
  }

  /**
   * Extract all relevant form fields from the current page
   * @returns {Array} Array of form field objects with metadata
   */
  extractFields() {
    console.log("Extracting form fields from page");
    
    // First try to detect common form platforms
    const platformType = this.detectFormPlatform();
    console.log(`Detected form platform: ${platformType}`);
    
    let formFields = [];
    
    // Extract fields based on detected platform
    if (platformType === 'google-forms') {
      formFields = this.extractGoogleFormFields();
    } else if (platformType === 'microsoft-forms') {
      formFields = this.extractMicrosoftFormFields();
    } else if (platformType === 'general-career-portal') {
      formFields = this.extractCareerPortalFields();
    } else {
      // Use the standard method as fallback
      formFields = this.extractStandardFormFields();
    }
    
    // If still no fields found, try a more aggressive approach
    if (formFields.length === 0) {
      console.log("No fields found with standard methods, trying aggressive detection");
      formFields = this.extractAllPossibleFields();
    }
    
    console.log(`Extracted a total of ${formFields.length} form fields`);
    console.log("Extracted fields:", formFields);
    
    return formFields;
  }
  
  /**
   * Detect what type of form platform is being used
   * @returns {string} The detected platform type
   */
  detectFormPlatform() {
    // Check for Google Forms
    if (
      document.querySelector('div[role="listitem"]') || 
      document.querySelector('div[data-params]') ||
      window.location.href.includes('docs.google.com/forms')
    ) {
      return 'google-forms';
    }
    
    // Check for Microsoft Forms
    if (
      document.querySelector('.office-form-question') || 
      document.querySelector('[data-automation-id="questionItem"]') ||
      window.location.href.includes('forms.office.com') ||
      window.location.href.includes('forms.microsoft.com')
    ) {
      return 'microsoft-forms';
    }
    
    // Check for common career portal elements
    if (
      document.querySelector('.career-portal') ||
      document.querySelector('.job-application') ||
      document.querySelector('.applicant-tracking-system') ||
      document.querySelector('[data-automation="jobApplication"]') ||
      document.querySelector('.application-form')
    ) {
      return 'general-career-portal';
    }
    
    // Default to standard forms
    return 'standard';
  }
  
  /**
   * Extract fields from Google Forms
   * @returns {Array} Array of form field objects
   */
  extractGoogleFormFields() {
    console.log("Extracting Google Form fields");
    const formFields = [];
    
    // Google Forms typically use divs with role="listitem" for questions
    const questionItems = document.querySelectorAll('div[role="listitem"]');
    
    questionItems.forEach((item, index) => {
      // Find the question title/label
      const titleElement = item.querySelector('[role="heading"], [data-item-title="true"], div[dir="auto"]');
      let questionTitle = titleElement ? titleElement.textContent.trim() : `Question ${index + 1}`;
      
      // Find the actual input field
      // For text fields
      const textInput = item.querySelector('input[type="text"], input:not([type]), textarea');
      
      // For radio buttons
      const radioInputs = item.querySelectorAll('input[type="radio"]');
      
      // For checkboxes
      const checkboxInputs = item.querySelectorAll('input[type="checkbox"]');
      
      // For select dropdowns
      const selectInput = item.querySelector('select');
      
      if (textInput) {
        const field = {
          element: textInput,
          type: textInput.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text',
          name: textInput.name || '',
          id: textInput.id || '',
          label: questionTitle,
          placeholder: textInput.placeholder || '',
          required: textInput.required || item.querySelector('.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk') !== null
        };
        
        console.log(`Extracted Google Form text field: ${field.label}`);
        formFields.push(field);
      } else if (radioInputs.length > 0) {
        // For Google Forms, we typically just need one radio input to represent the field
        const field = {
          element: radioInputs[0],
          type: 'radio',
          name: radioInputs[0].name || '',
          id: radioInputs[0].id || '',
          label: questionTitle,
          required: item.querySelector('.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk') !== null
        };
        
        console.log(`Extracted Google Form radio field: ${field.label}`);
        formFields.push(field);
      } else if (checkboxInputs.length > 0) {
        // For Google Forms, we typically just need one checkbox to represent the field
        const field = {
          element: checkboxInputs[0],
          type: 'checkbox',
          name: checkboxInputs[0].name || '',
          id: checkboxInputs[0].id || '',
          label: questionTitle,
          required: item.querySelector('.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk') !== null
        };
        
        console.log(`Extracted Google Form checkbox field: ${field.label}`);
        formFields.push(field);
      } else if (selectInput) {
        const field = {
          element: selectInput,
          type: 'select',
          name: selectInput.name || '',
          id: selectInput.id || '',
          label: questionTitle,
          required: selectInput.required || item.querySelector('.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk') !== null
        };
        
        console.log(`Extracted Google Form select field: ${field.label}`);
        formFields.push(field);
      }
      
      // Handle file upload fields
      const fileInput = item.querySelector('input[type="file"]');
      if (fileInput) {
        const field = {
          element: fileInput,
          type: 'file',
          name: fileInput.name || '',
          id: fileInput.id || '',
          label: questionTitle,
          required: fileInput.required || item.querySelector('.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk') !== null,
          acceptedExtensions: fileInput.getAttribute('accept') || '',
          multiple: fileInput.hasAttribute('multiple')
        };
        
        console.log(`Extracted Google Form file field: ${field.label}`);
        formFields.push(field);
      }
    });
    
    return formFields;
  }
  
  /**
   * Extract fields from Microsoft Forms
   * @returns {Array} Array of form field objects
   */
  extractMicrosoftFormFields() {
    console.log("Extracting Microsoft Form fields");
    const formFields = [];
    
    // Microsoft Forms typically use div with class 'office-form-question'
    const questionItems = document.querySelectorAll('.office-form-question, [data-automation-id="questionItem"]');
    
    questionItems.forEach((item, index) => {
      // Find the question title/label
      const titleElement = item.querySelector('.question-title-box, .office-form-question-title, [data-automation-id="questionTitle"]');
      let questionTitle = titleElement ? titleElement.textContent.trim() : `Question ${index + 1}`;
      
      // Find the actual input field
      // For text fields
      const textInput = item.querySelector('input[type="text"], input:not([type]), textarea');
      
      // For radio buttons
      const radioInputs = item.querySelectorAll('input[type="radio"]');
      
      // For checkboxes
      const checkboxInputs = item.querySelectorAll('input[type="checkbox"]');
      
      // For select dropdowns
      const selectInput = item.querySelector('select');
      
      if (textInput) {
        const field = {
          element: textInput,
          type: textInput.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text',
          name: textInput.name || '',
          id: textInput.id || '',
          label: questionTitle,
          placeholder: textInput.placeholder || '',
          required: textInput.required || item.querySelector('[aria-label*="required"], .office-form-asterisk') !== null
        };
        
        console.log(`Extracted Microsoft Form text field: ${field.label}`);
        formFields.push(field);
      } else if (radioInputs.length > 0) {
        const field = {
          element: radioInputs[0],
          type: 'radio',
          name: radioInputs[0].name || '',
          id: radioInputs[0].id || '',
          label: questionTitle,
          required: item.querySelector('[aria-label*="required"], .office-form-asterisk') !== null
        };
        
        console.log(`Extracted Microsoft Form radio field: ${field.label}`);
        formFields.push(field);
      } else if (checkboxInputs.length > 0) {
        const field = {
          element: checkboxInputs[0],
          type: 'checkbox',
          name: checkboxInputs[0].name || '',
          id: checkboxInputs[0].id || '',
          label: questionTitle,
          required: item.querySelector('[aria-label*="required"], .office-form-asterisk') !== null
        };
        
        console.log(`Extracted Microsoft Form checkbox field: ${field.label}`);
        formFields.push(field);
      } else if (selectInput) {
        const field = {
          element: selectInput,
          type: 'select',
          name: selectInput.name || '',
          id: selectInput.id || '',
          label: questionTitle,
          required: selectInput.required || item.querySelector('[aria-label*="required"], .office-form-asterisk') !== null
        };
        
        console.log(`Extracted Microsoft Form select field: ${field.label}`);
        formFields.push(field);
      }
      
      // Handle file upload fields
      const fileInput = item.querySelector('input[type="file"]');
      if (fileInput) {
        const field = {
          element: fileInput,
          type: 'file',
          name: fileInput.name || '',
          id: fileInput.id || '',
          label: questionTitle,
          required: fileInput.required || item.querySelector('[aria-label*="required"], .office-form-asterisk') !== null,
          acceptedExtensions: fileInput.getAttribute('accept') || '',
          multiple: fileInput.hasAttribute('multiple')
        };
        
        console.log(`Extracted Microsoft Form file field: ${field.label}`);
        formFields.push(field);
      }
    });
    
    return formFields;
  }
  
  /**
   * Extract fields from general career portals
   * @returns {Array} Array of form field objects
   */
  extractCareerPortalFields() {
    console.log("Extracting Career Portal fields");
    const formFields = [];
    
    // In career portals, look for form sections with labels
    const formSections = document.querySelectorAll('.form-section, .application-form, .job-application-form');
    
    if (formSections.length > 0) {
      // Process each section
      formSections.forEach(section => {
        // Find all input fields in this section
        const inputs = section.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
        const selects = section.querySelectorAll('select');
        const textareas = section.querySelectorAll('textarea');
        
        // Process inputs
        inputs.forEach(input => {
          const field = this.extractFieldInfo(input);
          if (field) {
            console.log(`Extracted career portal input field: ${field.label}`);
            formFields.push(field);
          }
        });
        
        // Process selects
        selects.forEach(select => {
          const field = this.extractFieldInfo(select);
          if (field) {
            console.log(`Extracted career portal select field: ${field.label}`);
            formFields.push(field);
          }
        });
        
        // Process textareas
        textareas.forEach(textarea => {
          const field = this.extractFieldInfo(textarea);
          if (field) {
            console.log(`Extracted career portal textarea field: ${field.label}`);
            formFields.push(field);
          }
        });
      });
    } else {
      // If no specific sections found, just get all form fields
      return this.extractStandardFormFields();
    }
    
    return formFields;
  }
  
  /**
   * Extract fields from standard HTML forms
   * @returns {Array} Array of form field objects
   */
  extractStandardFormFields() {
    console.log("Extracting standard form fields");
    
    // Find all form elements on the page
    const forms = document.querySelectorAll('form');
    console.log(`Found ${forms.length} forms on the page`);
    
    // Collect all input, select, and textarea elements from all forms
    const formFields = [];
    
    forms.forEach((form, formIndex) => {
      console.log(`Processing form ${formIndex}`);
      
      // Get all inputs, selects, and textareas from this form
      const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
      const selects = form.querySelectorAll('select');
      const textareas = form.querySelectorAll('textarea');
      
      console.log(`Form ${formIndex} has ${inputs.length} inputs, ${selects.length} selects, ${textareas.length} textareas`);
      
      // Process inputs
      inputs.forEach(input => {
        const field = this.extractFieldInfo(input);
        if (field) {
          console.log(`Extracted input field: ${field.label}`);
          formFields.push(field);
        }
      });
      
      // Process selects
      selects.forEach(select => {
        const field = this.extractFieldInfo(select);
        if (field) {
          console.log(`Extracted select field: ${field.label}`);
          formFields.push(field);
        }
      });
      
      // Process textareas
      textareas.forEach(textarea => {
        const field = this.extractFieldInfo(textarea);
        if (field) {
          console.log(`Extracted textarea field: ${field.label}`);
          formFields.push(field);
        }
      });
    });
    
    // If no form is found, try to get fields from the entire document
    if (formFields.length === 0) {
      console.log("No forms found, looking for form fields in the entire document");
      
      // Get all inputs, selects, and textareas from the document
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
      const selects = document.querySelectorAll('select');
      const textareas = document.querySelectorAll('textarea');
      
      console.log(`Document has ${inputs.length} inputs, ${selects.length} selects, ${textareas.length} textareas`);
      
      // Process inputs
      inputs.forEach(input => {
        const field = this.extractFieldInfo(input);
        if (field) {
          console.log(`Extracted input field: ${field.label}`);
          formFields.push(field);
        }
      });
      
      // Process selects
      selects.forEach(select => {
        const field = this.extractFieldInfo(select);
        if (field) {
          console.log(`Extracted select field: ${field.label}`);
          formFields.push(field);
        }
      });
      
      // Process textareas
      textareas.forEach(textarea => {
        const field = this.extractFieldInfo(textarea);
        if (field) {
          console.log(`Extracted textarea field: ${field.label}`);
          formFields.push(field);
        }
      });
    }
    
    return formFields;
  }
  
  /**
   * Extract all possible fields using more aggressive methods
   * @returns {Array} Array of form field objects
   */
  extractAllPossibleFields() {
    console.log("Using aggressive field detection");
    const formFields = [];
    
    // 1. Look for common input container patterns
    const fieldContainers = document.querySelectorAll(
      '.form-group, .field-container, .input-group, .form-control-group, ' +
      '.question-container, .form-item, .fieldset-wrapper, ' +
      '[role="group"], [role="fieldset"], [aria-labelledby]'
    );
    
    console.log(`Found ${fieldContainers.length} potential field containers`);
    
    // Process field containers
    fieldContainers.forEach(container => {
      // Look for input elements in this container
      const input = container.querySelector('input, select, textarea');
      if (input) {
        // Look for a label-like element in this container
        const labelElement = container.querySelector('label, div[class*="label"], div[class*="title"], span[class*="label"], span[class*="title"]');
        const labelText = labelElement ? labelElement.textContent.trim() : '';
        
        const field = this.extractFieldInfo(input);
        if (field) {
          // Override the label if we found a better one
          if (labelText && labelText.length > 0) {
            field.label = labelText;
          }
          
          console.log(`Extracted field from container: ${field.label}`);
          formFields.push(field);
        }
      }
    });
    
    // 2. Look for input fields near text that looks like labels
    const allTextNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue.trim();
      if (text.length > 0 && text.length < 100) {  // Reasonable label length
        allTextNodes.push(node);
      }
    }
    
    console.log(`Found ${allTextNodes.length} potential text labels`);
    
    // For each text node, look for nearby input elements
    allTextNodes.forEach(textNode => {
      const text = textNode.nodeValue.trim();
      if (!text.match(/^\W+$/)) {  // Skip nodes with only symbols
        const parent = textNode.parentNode;
        
        // Look for input elements that are siblings or children of parent
        const siblingInput = this.findNearbyInput(parent);
        
        if (siblingInput) {
          // Avoid duplicates
          const isDuplicate = formFields.some(field => 
            field.element === siblingInput || 
            (field.id && field.id === siblingInput.id) || 
            (field.name && field.name === siblingInput.name)
          );
          
          if (!isDuplicate) {
            const field = this.extractFieldInfo(siblingInput);
            if (field) {
              // Use the text node as label if it's better
              if (text.length > field.label.length) {
                field.label = text;
              }
              
              console.log(`Extracted field from text proximity: ${field.label}`);
              formFields.push(field);
            }
          }
        }
      }
    });
    
    // 3. Handle file upload fields, which may have special handling
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(fileInput => {
      // Avoid duplicates
      const isDuplicate = formFields.some(field => 
        field.element === fileInput || 
        (field.id && field.id === fileInput.id) || 
        (field.name && field.name === fileInput.name)
      );
      
      if (!isDuplicate) {
        const field = this.extractFieldInfo(fileInput);
        if (field) {
          field.acceptedExtensions = fileInput.getAttribute('accept') || '';
          field.multiple = fileInput.hasAttribute('multiple');
          
          console.log(`Extracted file upload field: ${field.label}`);
          formFields.push(field);
        }
      }
    });
    
    return formFields;
  }
  
  /**
   * Find an input element near the given element
   * @param {Element} element - Starting element to search from
   * @returns {Element|null} Found input element or null
   */
  findNearbyInput(element) {
    // Check children first
    const childInput = element.querySelector('input, select, textarea');
    if (childInput) {
      return childInput;
    }
    
    // Check siblings next
    let sibling = element.nextElementSibling;
    while (sibling) {
      if (sibling.matches('input, select, textarea')) {
        return sibling;
      }
      
      const nestedInput = sibling.querySelector('input, select, textarea');
      if (nestedInput) {
        return nestedInput;
      }
      
      sibling = sibling.nextElementSibling;
    }
    
    // Check parent siblings as a last resort
    if (element.parentNode && element.parentNode !== document.body) {
      const parentSibling = element.parentNode.nextElementSibling;
      if (parentSibling) {
        if (parentSibling.matches('input, select, textarea')) {
          return parentSibling;
        }
        
        const nestedInput = parentSibling.querySelector('input, select, textarea');
        if (nestedInput) {
          return nestedInput;
        }
      }
    }
    
    return null;
  }

  /**
   * Check if an element is visible on the page
   * @param {Element} element - DOM element to check
   * @returns {boolean} Whether the element is visible
   */
  isVisible(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  }

  /**
   * Extract information about a form field
   * @param {Element} input - Form field element
   * @returns {Object|null} Field information or null if not relevant
   */
  extractFieldInfo(element) {
    if (!element) return null;
    
    // Make sure the element is properly stored
    const field = {
      element: element,
      type: element.type || element.tagName.toLowerCase(),
      name: element.name || '',
      id: element.id || '',
      label: '',
      placeholder: element.placeholder || '',
      required: element.required || false
    };
    
    // Try to find a label for this field
    let label = null;
    
    // First check if there's a label element associated with this field by its ID
    if (element.id) {
      label = document.querySelector(`label[for="${element.id}"]`);
    }
    
    // If no label found by ID, check if the field is inside a label
    if (!label) {
      label = element.closest('label');
    }
    
    // If no label found, check if there's a label or label-like element nearby
    if (!label) {
      // Look for the closest parent that might contain a label
      const container = element.closest('.form-group, .field-container, .input-group, .form-item, [role="group"]');
      if (container) {
        // Try to find a label element in this container
        label = container.querySelector('label, [class*="label"], [class*="title"], [aria-label]');
      }
    }
    
    // Check for aria-label attribute directly on the element
    if (!label && element.getAttribute('aria-label')) {
      field.label = element.getAttribute('aria-label');
    }
    
    // Check for aria-labelledby
    if (!label && element.getAttribute('aria-labelledby')) {
      const labelledById = element.getAttribute('aria-labelledby');
      const labellingElement = document.getElementById(labelledById);
      if (labellingElement) {
        field.label = labellingElement.textContent.trim();
      }
    }
    
    // If we found a label element, extract its text content
    if (label) {
      field.label = label.textContent.trim();
    } else {
      // Try to get the label from the element's attributes
      if (element.title) {
        field.label = element.title;
      } else if (element.placeholder) {
        field.label = element.placeholder;
      } else if (element.name) {
        // Convert name to a more readable format
        field.label = element.name
          .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
      } else if (element.id) {
        // Convert id to a more readable format
        field.label = element.id
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^\w/, c => c.toUpperCase());
      }
    }
    
    // Skip fields with no meaningful label
    if (!field.label && !field.name && !field.placeholder) {
      return null;
    }
    
    // Set a fallback label if still empty
    if (!field.label) {
      field.label = field.name || field.placeholder || field.id || 'Unnamed Field';
    }
    
    return field;
  }

  /**
   * Get the extracted form fields
   * @returns {Array} Array of form field objects
   */
  getFormFields() {
    return this.formFields;
  }
}

// Make it available globally
window.FormFieldExtractor = FormFieldExtractor;