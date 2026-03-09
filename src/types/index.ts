export type CountryOption = {
  id: string;
  name: string;
  code: string;
  visited: boolean;
};

export type CityOption = {
  id: string;
  name: string;
  countryId: string;
};

export type VisitWithRelations = {
  id: string;
  userId: string;
  countryId: string | null;
  cityId: string | null;
  visitedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  country: { id: string; name: string; code: string } | null;
  city: { id: string; name: string; lat: number | null; lng: number | null } | null;
};
