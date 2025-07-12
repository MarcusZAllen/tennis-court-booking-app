// Typography System for Tennis Court Booking App
// Based on existing font sizes used throughout the frontend

export const typography = {
  // Header - Main page title (text-3xl)
  header: "text-3xl font-bold font-jost uppercase leading-tight",
  
  // Sub Header - Section titles and modal titles (text-xl)
  subHeader: "text-xl font-semibold font-jost leading-none tracking-tight",
  
  // Section Title - Calendar headers, button text (text-base)
  sectionTitle: "text-base font-medium font-jost",
  
  // Text Paragraph - Main content, descriptions (text-lg md:text-xl)
  textParagraph: "text-lg md:text-xl font-normal",
  
  // Text Small - Secondary content, labels, metadata (text-sm)
  textSmall: "text-sm font-normal",
  
  // Text Extra Small - Captions, badges, fine print (text-[10px])
  textExtraSmall: "text-[10px] font-medium tracking-tight",
} as const;

// Utility classes for common text combinations
export const textStyles = {
  // Main page heading
  pageHeading: `${typography.header} text-black mb-3 md:mb-4`,
  
  // Page description
  pageDescription: `${typography.textParagraph} text-muted-foreground mb-4`,
  
  // Modal title
  modalTitle: `${typography.subHeader} text-center mb-3`,
  
  // Modal description
  modalDescription: `text-center mb-6 text-gray-600`,
  
  // Button text
  buttonText: `${typography.sectionTitle} uppercase tracking-widest`,
  
  // Small button text (for pills and navbar)
  buttonTextSmall: `text-base font-medium font-jost uppercase tracking-widest`,
  
  // Location name
  locationName: `${typography.sectionTitle} font-medium text-gray-900`,
  
  // Availability count
  availabilityCount: "text-[1.2rem] font-medium leading-none",
  
  // Availability label
  availabilityLabel: `${typography.textExtraSmall} tracking-tight`,
  
  // Calendar day header
  calendarDayHeader: `${typography.sectionTitle} text-black text-center`,
  
  // Calendar time
  calendarTime: `${typography.sectionTitle} font-normal text-black`,
  
  // Footer text
  footerText: `${typography.textSmall} text-gray-400 opacity-90`,
  
  // Error text
  errorText: `text-xl font-bold mb-2`,
  
  // Loading text
  loadingText: `text-lg text-gray-600`,
} as const;

// Font weight constants
export const fontWeights = {
  normal: "font-normal",
  medium: "font-medium", 
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

// Letter spacing constants
export const letterSpacing = {
  tight: "tracking-tight",
  normal: "tracking-normal", 
  wide: "tracking-widest",
} as const; 