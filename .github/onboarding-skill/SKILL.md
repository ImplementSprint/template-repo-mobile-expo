---
name: mobile-template-onboarding
description: Onboard a new team to this Expo TypeScript boilerplate with safe customization boundaries, test setup instructions, and CI guardrails.
---

# Mobile Template Onboarding Skill

## Purpose
Use this skill whenever a team clones this boilerplate and needs a safe setup path without breaking CI, Detox, or release automation.

## Inputs
- Product name
- iOS bundle identifier
- Android applicationId
- API base URL(s)
- Feature scope for first release

## Outputs
- Completed onboarding checklist
- Updated app metadata and environment values
- Verified local test setup
- CI readiness confirmation

## Workflow
1. Verify prerequisites
- Node 20+
- Xcode (for iOS simulator builds)
- Android SDK + emulator tooling
- npm access

2. Initialize project identity
- Update app display name and slug in app.config.ts
- Set unique iOS bundle identifier and Android package
- Configure scheme and deep-link values

3. Configure runtime environment
- Copy .env.example into local env workflow
- Set EXPO_PUBLIC_APP_NAME, EXPO_PUBLIC_APP_ENV, EXPO_PUBLIC_API_BASE_URL
- Validate src/config/appConfig.ts resolves expected values

4. Respect boilerplate boundaries
- Allowed edits: src/**, tests/**, app.config.ts, .env usage, feature navigation, theme tokens
- Restricted edits: scripts/detox-build-android.ts, scripts/detox-build-ios.ts, tests/e2e/jest.config.ts, .github/workflows/**
- If restricted files must change, require platform review and CI dry run

5. Validate tests
- Unit: npm run test:unit
- Lint: npm run lint
- Typecheck: npm run typecheck
- Detox Android: npm run detox:build and npm run detox:test
- Detox iOS: npm run detox:build:ios and npm run detox:test:ios

6. Validate CI expectations
- MOBILE_SINGLE_SYSTEMS_JSON set in repo variables
- Understand artifact outputs:
  - Android: APK files
  - iOS simulator: .app.zip (contains .app bundle directory)
- Understand promotion behavior and PR-first execution model

## Guardrails
- Keep TypeScript strict mode enabled.
- Do not reintroduce legacy Detox adapters (detoxCircus + adapter/specReporter wiring).
- Do not downgrade Expo-managed package compatibility.
- Prefer Expo-compatible upgrades verified by npx expo install --check.

## Definition of Done
- npm run verify passes
- Detox config uses jest runner defaults without legacy adapter init files
- CI run reaches build + artifact upload
- Onboarding checklist is complete and committed
