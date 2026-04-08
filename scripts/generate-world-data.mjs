import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const countries = require("world-countries");
const worldAtlas = require("world-atlas/countries-10m.json");

const outputDir = path.resolve(process.cwd(), "data");
const viewBox = { width: 2000, height: 1000, padding: 0 };
const markerHalfSize = 8;

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

function roundNumbers(input, precision = 1) {
  return input.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (match) => {
    const numeric = Number(match);
    const rounded = Number(numeric.toFixed(precision));
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  });
}

function roundBounds(bounds) {
  return bounds.map((pair) => pair.map((value) => Number(value.toFixed(1))));
}

const countryByNumericCode = new Map(
  countries
    .filter((country) => country.status === "officially-assigned" && country.ccn3)
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
  .filter((country) => country.status === "officially-assigned" && !atlasCodes.has(country.cca2))
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

if (!markerCountries.every((country) => Array.isArray(country.latlng) && country.latlng.length === 2)) {
  throw new Error("A supplemental marker country is missing coordinates.");
}

const projection = geoEquirectangular()
  .scale(viewBox.width / (2 * Math.PI))
  .translate([viewBox.width / 2, viewBox.height / 2]);

const pathGenerator = geoPath(projection);
const sphereOutlinePath = roundNumbers(pathGenerator({ type: "Sphere" }), 1);

function cleanProjectedPath(pathData) {
  const cleaned = pathData.split(sphereOutlinePath).join("");
  return cleaned.trim() || pathData;
}

const generatedCountries = atlasBackedCountries.map((country) => {
  const feature = {
    ...country.feature,
    properties: {
      ...country.feature.properties,
      code: country.code,
      name: country.name,
    },
  };

  const pathData = pathGenerator(feature);
  const bounds = pathGenerator.bounds(feature);

  if (!pathData) {
    throw new Error(`Failed to generate path for ${country.code}`);
  }

  const cleanedPath = cleanProjectedPath(roundNumbers(pathData, 1));

  return {
    code: country.code,
    code3: country.code3,
    name: country.name,
    continent: country.continent,
    path: cleanedPath,
    bounds: roundBounds(bounds),
  };
});

const generatedMarkers = markerCountries.map((country) => {
  const [latitude, longitude] = country.latlng;
  const point = projection([longitude, latitude]);

  if (!point) {
    throw new Error(`Failed to project supplemental marker for ${country.code}`);
  }

  const [x, y] = point;
  const pathData = [
    `M${(x - markerHalfSize).toFixed(1)},${(y - markerHalfSize).toFixed(1)}`,
    `H${(x + markerHalfSize).toFixed(1)}`,
    `V${(y + markerHalfSize).toFixed(1)}`,
    `H${(x - markerHalfSize).toFixed(1)}`,
    "Z",
  ].join("");

  return {
    code: country.code,
    code3: country.code3,
    name: country.name,
    continent: country.continent,
    path: roundNumbers(pathData, 1),
    bounds: roundBounds([
      [x - markerHalfSize, y - markerHalfSize],
      [x + markerHalfSize, y + markerHalfSize],
    ]),
  };
});

const allGeneratedCountries = [...generatedCountries, ...generatedMarkers].sort((left, right) =>
  left.name.localeCompare(right.name),
);

const worldMapContents = `import type { ContinentKey } from "./continents";

export interface WorldMapCountry {
  code: string;
  code3: string;
  name: string;
  continent: ContinentKey;
  path: string;
  bounds: [[number, number], [number, number]];
}

export const WORLD_MAP_VIEWBOX = {
  width: ${viewBox.width},
  height: ${viewBox.height},
} as const;

export const WORLD_MAP_COUNTRIES: WorldMapCountry[] = ${JSON.stringify(allGeneratedCountries, null, 2)} as WorldMapCountry[];
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
  `Generated ${allGeneratedCountries.length} countries into data/worldMap.ts (${generatedMarkers.length} supplemental markers)`,
);
