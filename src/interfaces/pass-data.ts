
export interface PassImage {
  url: string; // Object URL for client-side display
  alt: string;
}

export interface PassField {
  key: string;
  label?: string;
  value: string | number; // Value can be string or number directly from JSON
  changeMessage?: string;
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight' | 'PKTextAlignmentNatural';
  // For dates
  dateStyle?: 'PKDateStyleNone' | 'PKDateStyleShort' | 'PKDateStyleMedium' | 'PKDateStyleLong' | 'PKDateStyleFull';
  timeStyle?: 'PKDateStyleNone' | 'PKDateStyleShort' | 'PKDateStyleMedium' | 'PKDateStyleLong' | 'PKDateStyleFull';
  isRelative?: boolean;
  // For currency
  currencyCode?: string;
  // For numbers
  numberStyle?: 'PKNumberStyleDecimal' | 'PKNumberStylePercent' | 'PKNumberStyleScientific' | 'PKNumberStyleSpellOut';
  // Attributed value could also be complex, but we'll simplify for display
  attributedValue?: string; // Often HTML, but we'll treat as string for simplicity
}

export interface PassBarcode {
  altText?: string;
  format: string; // e.g., "PKBarcodeFormatQR", "PKBarcodeFormatPDF417"
  message: string;
  messageEncoding: string; // e.g., "iso-8859-1"
}

export interface PassColors {
  backgroundColor?: string; // e.g., "rgb(255, 255, 255)"
  foregroundColor?: string; 
  labelColor?: string; 
  stripColor?: string; 
}

export interface PassImages {
  icon?: PassImage;
  logo?: PassImage;
  background?: PassImage;
  footer?: PassImage;
  strip?: PassImage;
  thumbnail?: PassImage;
}

export interface PassStructure {
  headerFields?: PassField[];
  primaryFields?: PassField[];
  secondaryFields?: PassField[];
  auxiliaryFields?: PassField[];
  backFields?: PassField[]; // Fields for the back of the pass
  transitType?: 'PKTransitTypeAir' | 'PKTransitTypeBoat' | 'PKTransitTypeBus' | 'PKTransitTypeGeneric' | 'PKTransitTypeTrain'; // For boarding passes
}

export interface PassData {
  formatVersion: number;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  webServiceURL?: string;
  authenticationToken?: string;
  organizationName: string;
  description: string;
  logoText?: string;
  
  // Pass content structure will be one of these, based on pass.json
  boardingPass?: PassStructure;
  coupon?: PassStructure;
  eventTicket?: PassStructure;
  generic?: PassStructure;
  storeCard?: PassStructure;
  
  barcode?: PassBarcode; // A single barcode object
  barcodes?: PassBarcode[]; // An array of barcode objects (usually only one is primary)
  
  // Extracted and processed for easy use in preview
  effectivePassStructure: PassStructure; // The one that's actually present (e.g., eventTicket content)
  effectiveColors: PassColors;
  effectiveImages: PassImages; // URLs will be object URLs from parsing
}

// Helper type for the parser function
export type PkpassParserResult = {
  success: true;
  data: PassData;
} | {
  success: false;
  error: string;
};
