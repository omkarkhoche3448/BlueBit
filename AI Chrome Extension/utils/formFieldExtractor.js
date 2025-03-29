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
    // Target input types that are commonly used in forms
    const inputSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="number"]',
      'input[type="date"]',
      'textarea',
      'select'
    ];

    const allInputs = document.querySelectorAll(inputSelectors.join(', '));
    this.formFields = [];

    allInputs.forEach(input => {
      // Skip hidden or disabled inputs
      if (input.type === 'hidden' || input.disabled || !this.isVisible(input)) {
        return;
      }

      // Get field metadata
      const fieldInfo = this.getFieldInfo(input);
      if (fieldInfo) {
        this.formFields.push(fieldInfo);
      }
    });

    return this.formFields;
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
  getFieldInfo(input) {
    // Get label text
    let labelText = '';
    
    // Try to find label by for attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        labelText = label.textContent.trim();
      }
    }
    
    // If no label found, try parent label
    if (!labelText && input.closest('label')) {
      labelText = input.closest('label').textContent.trim();
      // Remove the input's value from the label text if it's there
      if (input.value) {
        labelText = labelText.replace(input.value, '').trim();
      }
    }
    
    // If still no label, try placeholder or name attribute
    if (!labelText) {
      labelText = input.placeholder || input.name || '';
    }
    
    // Try to find nearby text that might be a label
    if (!labelText) {
      labelText = this.findNearbyLabelText(input);
    }

    // Skip if we couldn't determine any label or identifier
    if (!labelText) {
      return null;
    }

    return {
      element: input,
      type: input.type || input.tagName.toLowerCase(),
      id: input.id || '',
      name: input.name || '',
      label: labelText,
      placeholder: input.placeholder || '',
      value: input.value || '',
      required: input.required || false
    };
  }

  /**
   * Find text near an input that might be its label
   * @param {Element} input - Form field element
   * @returns {string} Potential label text
   */
  findNearbyLabelText(input) {
    // Look for nearby elements that might contain label text
    const parent = input.parentElement;
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(input);
    
    // Check previous sibling
    if (index > 0) {
      const prevSibling = siblings[index - 1];
      if (prevSibling.tagName !== 'INPUT' && 
          prevSibling.tagName !== 'SELECT' && 
          prevSibling.tagName !== 'TEXTAREA') {
        return prevSibling.textContent.trim();
      }
    }
    
    // Check parent text content if it's short enough to likely be a label
    const parentText = parent.textContent.trim();
    if (parentText.length < 50) {
      return parentText;
    }
    
    return '';
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