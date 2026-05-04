import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const countries = require("world-countries");
const worldAtlas = require("world-atlas/countries-10m.json");

const outputDir = path.resolve(process.cwd(), "data");
const nonMemberObserverStateCodes = new Set(["PS", "VA"]);
const appSpecificCountryCodes = new Set(["AQ"]);

function isTrackedCountry(country) {
  return (
    country.status === "officially-assigned" &&
    (country.unMember || nonMemberObserverStateCodes.has(country.cca2) || appSpecificCountryCodes.has(country.cca2))
  );
}

function resolveContinent(region, subregion, code) {
  if (code === "AQ" || region === "Antarctic") {
    return "Antarctica";
  }

  if (region === "Americas") {
    return subregion === "South America" ? "South America" : "North America";
  }

  if (["Europe", "Asia", "Africa", "Oceania"].includes(region)) {
    return region;
  }

  throw new Error(`Unsupported continent mapping for ${code}: ${region} / ${subregion}`);
}

const countryByNumericCode = new Map(
  countries
    .filter((country) => isTrackedCountry(country) && country.ccn3)
    .map((country) => [country.ccn3, country]),
);

const atlasFeatures = feature(worldAtlas, worldAtlas.objects.countries).features;
const groupedCountries = new Map();

for (const topologyFeature of atlasFeatures) {
  const numericCode = String(topologyFeature.id).padStart(3, "0");
  const country = countryByNumericCode.get(numericCode);

  if (!country) {
    continue;
  }

  const existing = groupedCountries.get(country.cca2);

  if (existing) {
    existing.features.push(topologyFeature);
    continue;
  }

  groupedCountries.set(country.cca2, {
    code: country.cca2,
    code3: country.cca3,
    name: country.name.common,
    continent: resolveContinent(country.region, country.subregion, country.cca2),
    features: [topologyFeature],
  });
}

const atlasBackedCountries = [...groupedCountries.values()]
  .map((groupedCountry) => {
    const mergedFeature =
      groupedCountry.features.length === 1
        ? {
            ...groupedCountry.features[0],
            properties: {
              ...groupedCountry.features[0].properties,
              code: groupedCountry.code,
              name: groupedCountry.name,
            },
          }
        : {
            type: "FeatureCollection",
            features: groupedCountry.features.map((countryFeature) => ({
              ...countryFeature,
              properties: {
                ...countryFeature.properties,
                code: groupedCountry.code,
                name: groupedCountry.name,
              },
            })),
          };

    return {
      ...groupedCountry,
      feature: mergedFeature,
    };
  })
  .sort((left, right) => left.name.localeCompare(right.name));

const atlasCodes = new Set(atlasBackedCountries.map((country) => country.code));
const markerCountries = countries
  .filter((country) => isTrackedCountry(country) && !atlasCodes.has(country.cca2))
  .map((country) => ({
    code: country.cca2,
    code3: country.cca3,
    name: country.name.common,
    continent: resolveContinent(country.region, country.subregion, country.cca2),
    latlng: country.latlng,
  }));

if (!atlasBackedCountries.some((country) => country.code === "AQ")) {
  throw new Error("Antarctica is missing from the generated dataset.");
}

if (markerCountries.length > 0) {
  throw new Error(
    `Tracked countries missing atlas geometry: ${markerCountries
      .map((country) => `${country.code} (${country.name})`)
      .join(", ")}`,
  );
}

function getPolygonCoordinates(geometry) {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  throw new Error(`Unsupported geometry type for map feature: ${geometry.type}`);
}

function normalizeAntimeridianRing(ring) {
  if (ring.length === 0) {
    return ring;
  }

  let longitudeOffset = 0;
  let previousLongitude = ring[0][0];

  return ring.map(([longitude, latitude], index) => {
    if (index > 0) {
      const longitudeDelta = longitude + longitudeOffset - previousLongitude;

      if (longitudeDelta > 180) {
        longitudeOffset -= 360;
      } else if (longitudeDelta < -180) {
        longitudeOffset += 360;
      }
    }

    const normalizedLongitude = longitude + longitudeOffset;
    previousLongitude = normalizedLongitude;
    return [normalizedLongitude, latitude];
  });
}

function normalizeAntimeridianPolygons(polygons) {
  return polygons.map((polygon) => polygon.map((ring) => normalizeAntimeridianRing(ring)));
}

function buildCountryGeometry(featureInput) {
  const features = featureInput.type === "FeatureCollection" ? featureInput.features : [featureInput];
  const polygons = normalizeAntimeridianPolygons(
    features.flatMap((countryFeature) => getPolygonCoordinates(countryFeature.geometry)),
  );

  return polygons.length === 1
    ? {
        type: "Polygon",
        coordinates: polygons[0],
      }
    : {
        type: "MultiPolygon",
        coordinates: polygons,
      };
}

const allGeneratedCountries = atlasBackedCountries.map(({ code, code3, name, continent }) => ({
  code,
  code3,
  name,
  continent,
})).sort((left, right) =>
  left.name.localeCompare(right.name),
);

const geoJsonFeatureByCode = new Map([
  ...atlasBackedCountries.map((country) => [
    country.code,
    {
      type: "Feature",
      properties: {
        code: country.code,
        code3: country.code3,
        name: country.name,
        continent: country.continent,
      },
      geometry: buildCountryGeometry(country.feature),
    },
  ]),
]);

const worldMapGeoJson = {
  type: "FeatureCollection",
  features: allGeneratedCountries.map((country) => {
    const geoJsonFeature = geoJsonFeatureByCode.get(country.code);

    if (!geoJsonFeature) {
      throw new Error(`Missing GeoJSON feature for ${country.code}`);
    }

    return geoJsonFeature;
  }),
};

const countriesByCode = new Map();

for (const country of allGeneratedCountries) {
  const existingNames = countriesByCode.get(country.code) ?? [];
  existingNames.push(country.name);
  countriesByCode.set(country.code, existingNames);
}

const duplicateCountryMessages = [...countriesByCode.entries()]
  .filter(([, names]) => names.length > 1)
  .map(([code, names]) => `${code}: ${names.join(", ")}`);

if (duplicateCountryMessages.length > 0) {
  throw new Error(
    `Duplicate country codes found while generating world data:\n${duplicateCountryMessages.join("\n")}`,
  );
}

const worldMapContents = `import type { ContinentKey } from "./continents";
import type { FeatureCollection, Geometry } from "geojson";

export interface WorldMapCountry {
  code: string;
  code3: string;
  name: string;
  continent: ContinentKey;
}

export type WorldMapCountryProperties = WorldMapCountry;

export const WORLD_MAP_COUNTRIES: WorldMapCountry[] = ${JSON.stringify(allGeneratedCountries, null, 2)} as WorldMapCountry[];

export const WORLD_MAP_GEOJSON = ${JSON.stringify(worldMapGeoJson)} as FeatureCollection<Geometry, WorldMapCountryProperties>;
`;

const countriesContents = `import { WORLD_MAP_COUNTRIES } from "./worldMap";
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
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "worldMap.ts"), worldMapContents);
fs.writeFileSync(path.join(outputDir, "countries.ts"), countriesContents);

console.log(
  `Generated ${allGeneratedCountries.length} countries into data/worldMap.ts`,
);
