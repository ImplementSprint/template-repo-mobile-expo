import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const isWindows = process.platform === 'win32';
const gradleWrapper = isWindows ? 'gradlew.bat' : './gradlew';
const androidDir = join(process.cwd(), 'android');
const gradlePropertiesPath = join(androidDir, 'gradle.properties');
const projectBuildGradlePath = join(androidDir, 'build.gradle');
const appBuildGradlePath = join(androidDir, 'app', 'build.gradle');
const gradleWrapperPath = join(androidDir, gradleWrapper);
const debugApkDir = join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug');
const expectedDebugApkPath = join(debugApkDir, 'app-debug.apk');
const androidTestApkDir = join(androidDir, 'app', 'build', 'outputs', 'apk', 'androidTest', 'debug');
const expectedAndroidTestApkPath = join(androidTestApkDir, 'app-debug-androidTest.apk');
const kotlinVersion = '2.0.21';
// Build only the app module artifacts Detox needs.
// Running root-level assembleAndroidTest may trigger androidTest packaging
// on Expo library modules (for example :expo, :expo-log-box), which can fail
// without affecting Detox app binary requirements.
const gradleTaskArgs = [':app:assembleDebug', ':app:assembleAndroidTest', '-DtestBuildType=debug'];
const detoxRepositorySnippet = 'maven { url("$rootDir/../node_modules/detox/Detox-android") }';
const detoxDependencySnippet = "androidTestImplementation('com.wix:detox:+')";
const androidTestCoreSnippet = "androidTestImplementation('androidx.test:core:1.7.0')";
const androidTestRunnerSnippet = "androidTestImplementation('androidx.test:runner:1.7.0')";
const androidTestRulesSnippet = "androidTestImplementation('androidx.test:rules:1.7.0')";
const appCompatDependencySnippet = "implementation 'androidx.appcompat:appcompat:1.1.0'";

function run(command: string, args: string[], cwd = process.cwd()): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
  });

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (typeof result.status !== 'number') {
    process.exit(1);
  }
}

function ensureAndroidProject(): void {
  const hasAndroidDir = existsSync(androidDir);
  const hasGradleWrapper = existsSync(gradleWrapperPath);

  if (!hasAndroidDir || !hasGradleWrapper) {
    run('npx', ['expo', 'prebuild', '--platform', 'android', '--non-interactive']);
  }
}

function findFileByName(rootPath: string, fileNames: string[]): string | null {
  if (!existsSync(rootPath)) {
    return null;
  }

  const pending = [rootPath];

  while (pending.length > 0) {
    const currentPath = pending.pop();
    if (!currentPath) {
      break;
    }

    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        pending.push(entryPath);
        continue;
      }

      if (entry.isFile() && fileNames.includes(entry.name)) {
        return entryPath;
      }
    }
  }

  return null;
}

function patchProjectBuildGradle(): void {
  if (!existsSync(projectBuildGradlePath)) {
    return;
  }

  const content = readFileSync(projectBuildGradlePath, 'utf8');
  if (content.includes(detoxRepositorySnippet)) {
    return;
  }

  let patched = content.replace(/mavenCentral\(\)/, `mavenCentral()\n        ${detoxRepositorySnippet}`);

  if (patched === content) {
    patched = `${content}\n\nallprojects {\n    repositories {\n        ${detoxRepositorySnippet}\n    }\n}\n`;
  }

  writeFileSync(projectBuildGradlePath, patched, 'utf8');
  console.log('Patched android/build.gradle: added Detox Android repository.');
}

function patchAppBuildGradle(): void {
  if (!existsSync(appBuildGradlePath)) {
    return;
  }

  let content = readFileSync(appBuildGradlePath, 'utf8');
  let patched = content;

  if (!patched.includes("testBuildType System.getProperty('testBuildType', 'debug')")) {
    patched = patched.replace(
      /defaultConfig\s*\{/,
      "defaultConfig {\n        testBuildType System.getProperty('testBuildType', 'debug')\n        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'",
    );
  }

  if (!patched.includes(detoxDependencySnippet)) {
    patched = patched.replace(/dependencies\s*\{/, `dependencies {\n    ${detoxDependencySnippet}`);
  }

  if (!patched.includes(androidTestCoreSnippet)) {
    patched = patched.replace(/dependencies\s*\{/, `dependencies {\n    ${androidTestCoreSnippet}`);
  }

  if (!patched.includes(androidTestRunnerSnippet)) {
    patched = patched.replace(/dependencies\s*\{/, `dependencies {\n    ${androidTestRunnerSnippet}`);
  }

  if (!patched.includes(androidTestRulesSnippet)) {
    patched = patched.replace(/dependencies\s*\{/, `dependencies {\n    ${androidTestRulesSnippet}`);
  }

  if (!patched.includes(appCompatDependencySnippet)) {
    patched = patched.replace(/dependencies\s*\{/, `dependencies {\n    ${appCompatDependencySnippet}`);
  }

  if (patched !== content) {
    writeFileSync(appBuildGradlePath, patched, 'utf8');
    console.log('Patched android/app/build.gradle: added Detox Android test dependencies.');
  }
}

function ensureDetoxTestSource(): void {
  const mainActivityPath = findFileByName(join(androidDir, 'app', 'src', 'main'), ['MainActivity.java', 'MainActivity.kt']);

  if (!mainActivityPath) {
    console.error('Unable to locate MainActivity source for Detox Android test setup.');
    process.exit(1);
  }

  const mainActivityContent = readFileSync(mainActivityPath, 'utf8');
  const packageMatch = mainActivityContent.match(/package\s+([\w.]+)/);
  const classMatch = mainActivityContent.match(/class\s+([A-Za-z0-9_]+)/);

  const packageName = packageMatch?.[1];
  const activityName = classMatch?.[1] || 'MainActivity';

  if (!packageName) {
    console.error(`Unable to resolve Android package name from ${mainActivityPath}`);
    process.exit(1);
  }

  const detoxTestPath = join(
    androidDir,
    'app',
    'src',
    'androidTest',
    'java',
    ...packageName.split('.'),
    'DetoxTest.java',
  );

  if (existsSync(detoxTestPath) && readFileSync(detoxTestPath, 'utf8').includes('Detox.runTests')) {
    return;
  }

  const detoxTestSource = `package ${packageName};

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<${activityName}> mActivityRule = new ActivityTestRule<>(${activityName}.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
`;

  mkdirSync(dirname(detoxTestPath), { recursive: true });
  writeFileSync(detoxTestPath, detoxTestSource, 'utf8');
  console.log(`Created Detox Android test source at ${detoxTestPath}.`);
}

function runGradleBuild(): void {
  if (isWindows) {
    run(gradleWrapper, gradleTaskArgs, androidDir);
    return;
  }

  run('chmod', ['+x', './gradlew'], androidDir);
  run('bash', ['./gradlew', ...gradleTaskArgs], androidDir);
}

function ensureExpectedDebugApk(): void {
  if (existsSync(expectedDebugApkPath)) {
    return;
  }

  if (!existsSync(debugApkDir)) {
    console.error(`Missing APK output directory: ${debugApkDir}`);
    process.exit(1);
  }

  const debugApkCandidates = readdirSync(debugApkDir)
    .filter((fileName) => fileName.endsWith('.apk'))
    .sort((left, right) => left.localeCompare(right));

  const [firstCandidate] = debugApkCandidates;

  if (!firstCandidate) {
    console.error(`No debug APK found under: ${debugApkDir}`);
    process.exit(1);
  }

  const candidatePath = join(debugApkDir, firstCandidate);

  mkdirSync(debugApkDir, { recursive: true });
  copyFileSync(candidatePath, expectedDebugApkPath);
  console.log(`Normalized debug APK for Detox: ${firstCandidate} -> app-debug.apk`);
}

function ensureExpectedAndroidTestApk(): void {
  if (existsSync(expectedAndroidTestApkPath)) {
    return;
  }

  if (!existsSync(androidTestApkDir)) {
    console.error(`Missing Android test APK output directory: ${androidTestApkDir}`);
    process.exit(1);
  }

  const androidTestApkCandidates = readdirSync(androidTestApkDir)
    .filter((fileName) => fileName.endsWith('.apk'))
    .sort((left, right) => left.localeCompare(right));

  const [firstCandidate] = androidTestApkCandidates;

  if (!firstCandidate) {
    console.error(`No Android test APK found under: ${androidTestApkDir}`);
    process.exit(1);
  }

  const candidatePath = join(androidTestApkDir, firstCandidate);

  mkdirSync(androidTestApkDir, { recursive: true });
  copyFileSync(candidatePath, expectedAndroidTestApkPath);
  console.log(`Normalized Android test APK for Detox: ${firstCandidate} -> app-debug-androidTest.apk`);
}

function forceDebugBundling(): void {
  if (!existsSync(appBuildGradlePath)) {
    return;
  }

  const content = readFileSync(appBuildGradlePath, 'utf8');
  if (content.includes('debuggableVariants = []')) {
    return;
  }

  const patched = content.replace(
    /react\s*\{/,
    'react {\n    // Force JS bundling in debug builds — no Metro server available in CI/Detox\n    debuggableVariants = []',
  );

  if (patched !== content) {
    writeFileSync(appBuildGradlePath, patched, 'utf8');
    console.log('Patched build.gradle: forced JS bundling in debug builds for Detox.');
  }
}

function normalizeGradleProperties(): void {
  if (!existsSync(gradlePropertiesPath)) {
    return;
  }

  const raw = readFileSync(gradlePropertiesPath, 'utf8');
  const normalizedLines = raw
    .replaceAll('\r\n', '\n')
    .split('\n')
    .filter((line) => !line.startsWith('kotlinVersion='));

  normalizedLines.push(`kotlinVersion=${kotlinVersion}`);

  writeFileSync(gradlePropertiesPath, `${normalizedLines.join('\n').replace(/\n+$/u, '')}\n`, 'utf8');
}

ensureAndroidProject();
normalizeGradleProperties();
patchProjectBuildGradle();
patchAppBuildGradle();
ensureDetoxTestSource();
forceDebugBundling();

runGradleBuild();
ensureExpectedDebugApk();
ensureExpectedAndroidTestApk();
