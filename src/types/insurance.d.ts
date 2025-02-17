
export interface ProviderSearchFilters {
  specialty?: string;
  locations?: string[];
  network_status?: 'in-network' | 'out-of-network';
  accepting_new_patients?: boolean;
  distance: number;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  provider_name: string;
  specialty: string;
  network_status: 'in-network' | 'out-of-network';
  accepting_new_patients: boolean;
  locations: Array<{
    address: string;
    phone: string;
  }>;
  rating?: number;
}

export interface InsuranceBenefit {
  id: string;
  benefit_name: string;
  name: string;
  description: string;
  coverage_percentage: number;
  deductible_applies: boolean;
  requires_preauth: boolean;
  requires_preauthorization: boolean;
  network_restrictions?: string;
  limitations?: string;
  copay_amount?: number;
  annual_limit?: number;
  waiting_period_days?: number;
}

export interface InsuranceNetworkProviderRow {
  id: string;
  provider_name: string;
  specialty: string;
  location: {
    address: string;
  };
  contact_info: {
    phone: string;
  };
  network_status: 'in-network' | 'out-of-network';
  accepting_new_patients: boolean;
}
