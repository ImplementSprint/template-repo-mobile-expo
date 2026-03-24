# Expo TypeScript Boilerplate (Single Root)

This repository is a reusable Expo + TypeScript boilerplate for the single-system mobile pipeline.

Start here:

- Onboarding guide: ONBOARDING.md
- Reusable onboarding skill: onboarding-skill/SKILL.md

## Stack

- Expo SDK 55
- React Native 0.83
- TypeScript (strict mode)
- React Navigation (native stack)
- Jest (`tests/unit`)
- Detox (`tests/e2e`)

## Structure

```text
src/
  app/
  config/
  features/
  navigation/
  theme/
  utils/
tests/
  unit/
  e2e/
```

## Commands

- `npm run start`: Start Expo dev server
- `npm run android`: Build and run Android app
- `npm run ios`: Build and run iOS app
- `npm run ios:prebuild`: Regenerate iOS native code from Expo config
- `npm run ios:build`: Run the local iOS build path used for simulator development
- `npm run web`: Run web target
- `npm run doctor`: Run Expo Doctor checks
- `npm run verify`: Run lint, type-check, unit tests, and Expo Doctor
- `npm run lint`: Lint all files
- `npm run typecheck`: Type-check project
- `npm run test`: Run unit tests with coverage
- `npm run detox:build`: Build Detox Android binary
- `npm run detox:test`: Run Detox tests
- `npm run detox:build:ios`: Build the Detox iOS simulator app
- `npm run detox:test:ios`: Run Detox tests on the iOS simulator
- `npm run android:prebuild`: Regenerate Android native code from Expo config

## Environment

Runtime config is resolved in `src/config/appConfig.ts`.

Defaults:

- `environment`: `development`
- `apiBaseUrl`: `https://api.example.com`

Optional variables:

- `EXPO_PUBLIC_APP_NAME`
- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`

An example file is provided at `.env.example`.

## Bootstrap Checklist

- Replace the placeholder Expo metadata in `app.config.ts` before your first release.
- Set a unique `scheme`, Android package name, and iOS bundle identifier for each app cloned from this template.
- Copy `.env.example` into your environment-specific secret management or local `.env` workflow.

## What Teams Can Touch

- `src/**`
- `tests/unit/**`
- `tests/e2e/**` test cases
- `app.config.ts`
- environment value wiring via `src/config/appConfig.ts`

## What Teams Should Not Touch Without Platform Review

- `.github/workflows/**`
- `scripts/detox-build-android.ts`
- `scripts/detox-build-ios.ts`
- `tests/e2e/jest.config.ts`

## CI

The template keeps a workflow caller at `.github/workflows/mobile-pipeline-caller.yml` that delegates to the central orchestrator.

Required repository variable:

- `MOBILE_SINGLE_SYSTEMS_JSON`

Recommended value:

```json
{
  "name": "mobile-expo",
  "dir": ".",
  "mobile_stack": "expo",
  "enable_android_build": true,
  "enable_ios_build": true,
  "version_stream": "mobile-expo"
}
```

CI build policy:

- The central mobile workflow builds Expo apps locally with `expo prebuild`, Gradle, xcodebuild, and Detox.
- `EXPO_TOKEN`, `EXPO_PROJECT_ID`, `EXPO_OWNER`, `eas.json`, and remote EAS credentials are not required for CI.
- The Android Detox helper normalizes `android/gradle.properties` so Expo Kotlin version settings stay deterministic in CI.
- Detox test setup uses Detox Jest runner defaults (`reporter`, `globalSetup`, `globalTeardown`, `testEnvironment`) with TypeScript E2E setup files.
- The app must remain TypeScript-only with strict mode enabled.

## Dependency Update Policy

- Keep Expo compatibility first.
- Run `npx expo install --check` before and after upgrades.
- Use `npm update` for compatible updates.
- Validate with `npm run verify` plus Detox build/test commands.


this is for testing again