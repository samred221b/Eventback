// Utility to validate and debug React Native component props
// Helps identify boolean prop issues before they reach native components

/**
 * Validate that boolean props are actually booleans
 * @param {Object} props - Component props object
 * @param {Array} booleanPropNames - Array of prop names that should be booleans
 * @returns {Object} - Validated props with proper boolean types
 */
export const validateBooleanProps = (props, booleanPropNames = []) => {
  const validatedProps = { ...props };
  
  booleanPropNames.forEach(propName => {
    if (propName in validatedProps) {
      const originalValue = validatedProps[propName];
      const originalType = typeof originalValue;
      
      // Convert string booleans to actual booleans
      if (originalType === 'string') {
        validatedProps[propName] = originalValue.toLowerCase() === 'true';
      } else if (originalType !== 'boolean' && originalValue != null) {
        validatedProps[propName] = Boolean(originalValue);
      }
    }
  });
  
  return validatedProps;
};

/**
 * Validate that numeric props are actually numbers
 * @param {Object} props - Component props object
 * @param {Array} numericPropNames - Array of prop names that should be numbers
 * @returns {Object} - Validated props with proper numeric types
 */
export const validateNumericProps = (props, numericPropNames = []) => {
  const validatedProps = { ...props };
  
  numericPropNames.forEach(propName => {
    if (propName in validatedProps) {
      const originalValue = validatedProps[propName];
      const originalType = typeof originalValue;
      
      if (originalType === 'string') {
        const numericValue = parseFloat(originalValue);
        if (!isNaN(numericValue)) {
          validatedProps[propName] = numericValue;
        }
      } else if (originalType !== 'number' && originalValue != null) {
        const numericValue = Number(originalValue);
        if (!isNaN(numericValue)) {
          validatedProps[propName] = numericValue;
        }
      }
    }
  });
  
  return validatedProps;
};

/**
 * Common React Native component prop validators
 */
export const COMMON_BOOLEAN_PROPS = {
  Text: ['selectable', 'allowFontScaling', 'adjustsFontSizeToFit'],
  ScrollView: ['horizontal', 'showsHorizontalScrollIndicator', 'showsVerticalScrollIndicator', 
               'scrollEnabled', 'bounces', 'bouncesZoom', 'alwaysBounceHorizontal', 
               'alwaysBounceVertical', 'pagingEnabled', 'scrollsToTop'],
  TouchableOpacity: ['disabled'],
  StatusBar: ['hidden', 'translucent'],
  View: ['accessible', 'accessibilityElementsHidden'],
};

export const COMMON_NUMERIC_PROPS = {
  Text: ['numberOfLines', 'minimumFontScale'],
  TouchableOpacity: ['activeOpacity'],
  View: ['opacity'],
};

/**
 * Debug function to log all prop types for a component
 * @param {string} componentName - Name of the component
 * @param {Object} props - Props object
 */
export const debugProps = (componentName, props) => {
  // Debug function - no-op in production
};
