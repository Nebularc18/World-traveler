export const CONTINENT_ORDER = [
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
] as const;

export type ContinentKey = (typeof CONTINENT_ORDER)[number];

export const CONTINENT_LABELS: Record<ContinentKey, string> = {
  Europe: "Europe",
  Asia: "Asia",
  Africa: "Africa",
  "North America": "North America",
  "South America": "South America",
  Oceania: "Oceania",
  Antarctica: "Antarctica",
};

export function resolveContinent(region: string, subregion: string, code: string): ContinentKey {
  if (code === "AQ" || region === "Antarctic") {
    return "Antarctica";
  }

  if (region === "Americas") {
    return subregion === "South America" ? "South America" : "North America";
  }

  if (region === "Europe" || region === "Asia" || region === "Africa" || region === "Oceania") {
    return region;
  }

  throw new Error(`Unsupported continent mapping for ${code}: ${region} / ${subregion}`);
}
