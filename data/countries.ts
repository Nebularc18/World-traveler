import { WORLD_MAP_COUNTRIES } from "./worldMap";
import type { ContinentKey } from "./continents";

export interface CountryRecord {
  code: string;
  name: string;
  continent: ContinentKey;
}

export const countries: CountryRecord[] = WORLD_MAP_COUNTRIES.map(({ code, name, continent }) => ({
  code,
  name,
  continent,
}));

export const countriesByCode: Record<string, CountryRecord> = Object.fromEntries(
  countries.map((country) => [country.code, country]),
);
