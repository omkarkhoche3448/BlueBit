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
    
    console.log(`Extracted a total of ${formFields.length} form fields`);
    console.log("Extracted fields:", formFields);
    
    return formFields;
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
    
    // If we found a label, extract its text content
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