
export interface PropertyListing {
  id: string;
  title: string;
  price: string;
  location: string;
  source: string;
  sourceUrl: string;
  description: string;
  contactName: string;
  contactNumber: string;
  contactRole: 'Owner' | 'Agent' | 'Direct Contact' | 'Unknown';
  isDirectOwner: boolean;
  verificationNote?: string;
  datePosted?: string;
  lat?: number;
  lng?: number;
}

export interface SearchFilters {
  query: string;
  propertyType: string;
  location: string;
  directSourceMode: 'all' | 'direct' | 'verified';
  minPrice?: number;
  maxPrice?: number;
}
