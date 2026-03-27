const fs = require('node:fs');
const path = require('node:path');

const { AndroidConfig, createRunOncePlugin, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
`;

function withDetoxAndroidCleartextTraffic(config) {
  const withManifest = withAndroidManifest(config, (configWithManifest) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(configWithManifest.modResults);

    mainApplication.$['android:usesCleartextTraffic'] = 'true';
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return configWithManifest;
  });

  return withDangerousMod(withManifest, [
    'android',
    async (configWithDangerousMod) => {
      const xmlDir = path.join(
        configWithDangerousMod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );

      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_CONFIG, 'utf8');

      return configWithDangerousMod;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withDetoxAndroidCleartextTraffic,
  'with-detox-android-cleartext-traffic',
  '1.0.0',
);
