# World Traveler Agent Notes

## Chosen Stack
- Expo SDK 55 with React Native and TypeScript
- Expo Router for navigation and tabs
- Expo development build workflow via `expo-dev-client`
- `react-native-svg` for the political world map
- `react-native-gesture-handler` and `react-native-reanimated` for pinch and pan
- AsyncStorage for local persistence

## Key Commands
- `npm install` - install dependencies
- `npm run generate:world-data` - regenerate the local country metadata and SVG path dataset
- `npm run start` - start Metro for a development build client
- `npm run android` - build and run the Android development build
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run doctor` - run Expo health checks

## Folder Structure
- `app/` - Expo Router layouts and tab screens
- `components/` - reusable UI pieces such as the map, legend, stats cards, and country sheet
- `data/` - generated world map data and continent helpers
- `hooks/` - theme and country status state providers/hooks
- `storage/` - AsyncStorage adapters
- `theme/` - central theme tokens and theme resolution helpers
- `utils/` - stats calculations and country status helpers
- `scripts/` - local data generation script

## Theming Approach
- Theme state is centralized with `ThemePreferenceProvider`
- Stored preference values are `system`, `light`, and `dark`
- Navigation, cards, tabs, legend, bottom sheet, and map-adjacent UI all use the same theme tokens
- The map fill colors stay distinct across themes through dedicated map color tokens

## Storage Approach
- Theme preference is stored under a dedicated AsyncStorage key in `storage/preferences.ts`
- Country statuses are stored separately in `storage/countryStatusStorage.ts`
- Screen code depends on provider/hooks rather than direct storage calls so a future sync layer can replace AsyncStorage cleanly

## Map Data Approach
- Core map data is local and committed in `data/worldMap.ts`
- `scripts/generate-world-data.mjs` builds the dataset from `world-countries` plus `d3-geo`
- The generated map uses a fixed Natural Earth projection and includes Antarctica explicitly
- Tracking totals use the same generated ISO-assigned dataset as the map, preventing stats/map drift
