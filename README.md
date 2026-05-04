# World Traveler

World Traveler is an Expo React Native app for tracking where you have been and where you want to go. It uses a local political world map dataset, stores travel status on the device, and includes map, stats, and appearance screens.

## Features

- Interactive MapLibre world map with native pinch, pan, and double-tap zoom.
- Country status tracking for `visited`, `wishlist`, and `unmarked`.
- Local persistence with AsyncStorage.
- Travel stats by total countries and continent.
- Light, dark, and system theme preferences.
- Expo Router tab navigation.
- Generated local world map data for UN member and observer states, plus Antarctica.

## Tech Stack

- Expo SDK 55
- React Native and TypeScript
- Expo Router
- Expo development builds with `expo-dev-client`
- `@maplibre/maplibre-react-native` for native map rendering and gestures
- AsyncStorage for local data

## Getting Started

Install dependencies:

```sh
npm install
```

Start Metro for an Expo development build:

```sh
npm run start
```

Build and run the Android development build:

```sh
npm run android
```

Run on iOS:

```sh
npm run ios
```

Run on web:

```sh
npm run web
```

## Scripts

```sh
npm run start
```

Starts Metro for a development build client.

```sh
npm run android
```

Builds and runs the Android development build. The helper script detects the Android SDK and writes `android/local.properties` when possible.

```sh
npm run ios
```

Builds and runs the iOS development build.

```sh
npm run web
```

Starts the Expo web server.

```sh
npm run lint
```

Runs ESLint.

```sh
npm run typecheck
```

Runs TypeScript checks without emitting files.

```sh
npm run generate:world-data
```

Regenerates the local country metadata and GeoJSON map source.

```sh
npm run doctor
```

Runs Expo Doctor.

## World Map Data

Map data is generated into `data/worldMap.ts` from `world-countries`, `world-atlas`, and `topojson-client`. The generator emits country metadata and a local GeoJSON source, keeping the app's tracking dataset aligned with the rendered MapLibre map.

The generated dataset tracks the 193 United Nations Member States plus the Holy See/Vatican City and the State of Palestine observer states, with Antarctica kept as an app-specific map entry. All tracked entries use real polygon geometry from `world-atlas`.

## Project Structure

```text
app/         Expo Router layouts and tab screens
components/  Reusable UI components
data/        Generated map data and country helpers
hooks/       Theme and country status providers
scripts/     Local data generation and environment helpers
storage/     AsyncStorage adapters
theme/       Theme tokens and types
utils/       Stats and country status helpers
assets/      App icons and splash assets
```

## License

This project is licensed under the terms in `LICENSE`.
