const { withAppBuildGradle } = require('@expo/config-plugins');
function unsignedRelease(contents) {
  if (contents.includes('// VICO_LOCAL_SIGNING')) return contents;
  const pattern = /(\bbuildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
  if (!pattern.test(contents)) throw new Error('Android release signing template changed; review before building.');
  return contents.replace(pattern, '$1signingConfig null // VICO_LOCAL_SIGNING: the owner signs the verified APK locally.');
}
module.exports = config => withAppBuildGradle(config, config => {
  if (config.modResults.language !== 'groovy') throw new Error('Review Android signing configuration for this Gradle language.');
  config.modResults.contents = unsignedRelease(config.modResults.contents);
  return config;
});
module.exports.unsignedRelease = unsignedRelease;
