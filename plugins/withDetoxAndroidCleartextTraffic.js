const { AndroidConfig, createRunOncePlugin, withAndroidManifest } = require('expo/config-plugins');

function withDetoxAndroidCleartextTraffic(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(configWithManifest.modResults);

    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    return configWithManifest;
  });
}

module.exports = createRunOncePlugin(
  withDetoxAndroidCleartextTraffic,
  'with-detox-android-cleartext-traffic',
  '1.0.0',
);
