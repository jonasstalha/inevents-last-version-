const fs = require('fs');
const { withDangerousMod, withPodfile } = require('@expo/config-plugins');

const compatibilityMarker = '[withFirebaseModularHeaders]';

const compatibilitySettings = `
  # ${compatibilityMarker}
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      if target.name.start_with?('RNFB')
        build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        build_config.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'
        build_config.build_settings['DEFINES_MODULE'] = 'NO'
      end
      if target.name.end_with?('-xcprivacy')
        build_config.build_settings['PRODUCT_NAME'] = target.name
      end
    end
  end
  installer.pods_project.save`;

module.exports = function withFirebaseModularHeaders(config) {
  config = withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    if (!podfile.includes('use_modular_headers!')) {
      config.modResults.contents = config.modResults.contents.replace(
        /^platform :ios.*$/m,
        (platformLine) => `${platformLine}\n\nuse_modular_headers!\n$RNFirebaseAsStaticFramework = true`,
      );
    }
    return config;
  });

  return withDangerousMod(config, ['ios', async (config) => {
    const screensHeaderConfigPath = `${config.modRequest.projectRoot}/node_modules/react-native-screens/ios/RNSScreenStackHeaderConfig.mm`;
    if (fs.existsSync(screensHeaderConfigPath)) {
      const screensHeaderConfig = fs.readFileSync(screensHeaderConfigPath, 'utf8');
      const patchedScreensHeaderConfig = screensHeaderConfig
        .replace('static constexpr auto DEFAULT_TITLE_FONT_SIZE = @17;', 'static const auto DEFAULT_TITLE_FONT_SIZE = @17;')
        .replace('static constexpr auto DEFAULT_TITLE_LARGE_FONT_SIZE = @34;', 'static const auto DEFAULT_TITLE_LARGE_FONT_SIZE = @34;');

      if (patchedScreensHeaderConfig !== screensHeaderConfig) {
        fs.writeFileSync(screensHeaderConfigPath, patchedScreensHeaderConfig);
      }
    }

    const podfilePath = `${config.modRequest.platformProjectRoot}/Podfile`;
    let contents = fs.readFileSync(podfilePath, 'utf8');

    if (contents.includes('# InEvent Firebase compatibility settings')) {
      return config;
    }

    const settings = `\n  # InEvent Firebase compatibility settings${compatibilitySettings}`;

    if (contents.includes(compatibilityMarker)) {
      return config;
    }

    const postInstall = /^[ \t]*post_install do \|installer\|$/m;

    if (postInstall.test(contents)) {
      contents = contents.replace(postInstall, (line) => `${line}${settings}`);
    } else {
      contents += `\n\npost_install do |installer|${settings}\nend\n`;
    }

    fs.writeFileSync(podfilePath, contents);
    return config;
  }]);
};
