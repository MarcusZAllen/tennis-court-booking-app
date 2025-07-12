// Typography System for Tennis Court Booking App
// Using Tailwind CSS classes for consistency and maintainability

export const typography = {
  // Font sizes using Tailwind classes
  sizes: {
    xs: 'text-xs',           // 12px
    sm: 'text-sm',           // 14px
    base: 'text-base',       // 16px
    lg: 'text-lg',           // 18px
    xl: 'text-xl',           // 20px
    '2xl': 'text-2xl',       // 24px
    '3xl': 'text-3xl',       // 30px
    '4xl': 'text-4xl',       // 36px
    '5xl': 'text-5xl',       // 48px
    '6xl': 'text-6xl',       // 60px
    // Custom sizes
    '1.2': 'text-1.2',       // 1.2rem (19.2px)
    '10': 'text-10',         // 10px
  },
  
  // Font weights
  weights: {
    normal: 'font-normal',   // 400
    medium: 'font-medium',   // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',       // 700
  },
  
  // Font families
  families: {
    jost: 'font-jost',
    sans: 'font-sans',
  },
  
  // Line heights
  lineHeights: {
    none: 'leading-none',
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
  
  // Letter spacing
  letterSpacing: {
    tight: 'tracking-tight',
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
    widest: 'tracking-widest',
  },
} as const;

// Pre-composed text styles for common use cases
export const textStyles = {
  // Page heading - main title
  pageHeading: 'text-3xl md:text-3xl font-bold font-jost uppercase leading-tight text-black mb-3 md:mb-4',
  
  // Page description
  pageDescription: 'text-lg md:text-xl text-muted-foreground mb-4',
  
  // Modal title
  modalTitle: 'text-xl font-semibold font-jost text-center mb-3',
  
  // Modal description
  modalDescription: 'text-center mb-6 text-gray-600',
  
  // Button text
  buttonText: 'text-base font-medium font-jost uppercase tracking-widest',
  
  // Small button text (for pills and navbar)
  buttonTextSmall: 'text-base font-medium font-jost uppercase tracking-widest',
  
  // Location name
  locationName: 'text-base font-medium font-jost text-gray-900',
  
  // Availability count (slot numbers)
  availabilityCount: 'text-1.2 font-medium leading-none font-jost',
  
  // Availability label (slot "courts" text)
  availabilityLabel: 'text-10 font-medium tracking-tight font-jost',
  
  // Calendar day header
  calendarDayHeader: 'text-base font-medium font-jost text-black text-center',
  
  // Calendar time
  calendarTime: 'text-base font-normal font-jost text-black',
  
  // Footer text
  footerText: 'text-sm text-gray-400 opacity-90',
  
  // Error text
  errorText: 'text-xl font-bold mb-2',
  
  // Loading text
  loadingText: 'text-lg text-gray-600',
  
  // No courts message
  noCourtsMessage: 'text-lg font-medium',
  
  // Try again message
  tryAgainMessage: 'text-sm',
} as const;

// Utility function to compose typography classes
export const composeTypography = (
  size: keyof typeof typography.sizes,
  weight: keyof typeof typography.weights = 'normal',
  family: keyof typeof typography.families = 'jost',
  lineHeight?: keyof typeof typography.lineHeights,
  letterSpacing?: keyof typeof typography.letterSpacing
) => {
  const classes: string[] = [
    typography.sizes[size],
    typography.weights[weight],
    typography.families[family],
  ];
  
  if (lineHeight) classes.push(typography.lineHeights[lineHeight]);
  if (letterSpacing) classes.push(typography.letterSpacing[letterSpacing]);
  
  return classes.join(' ');
}; 