export interface CkanResource {
  id: string;
  name: string;
  format: string;
  url: string;
  created: string;
  last_modified: string;
}

export interface CkanOrganization {
  id: string;
  name: string;
  title: string;
}

export interface CkanGroup {
  id: string;
  name: string;
  title: string;
}

export interface CkanTag {
  id: string;
  name: string;
}

export interface CkanPackageShowResult {
  id: string;
  name: string;
  title: string;
  notes?: string;
  license_title?: string;
  metadata_modified: string;
  organization?: CkanOrganization;
  groups?: CkanGroup[];
  tags?: CkanTag[];
  resources: CkanResource[];
}

export interface CkanPackageSearchResult {
  count: number;
  results: CkanPackageShowResult[];
}

export interface CkanActionResponse<T> {
  success: boolean;
  result: T;
  error?: { message?: string; __type?: string };
}
