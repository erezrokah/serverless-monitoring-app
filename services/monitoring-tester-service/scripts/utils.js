const path = require('path');
const fs = require('fs-extra');

const updateE2eTestsConfig = async config => {
  const file = path.join('e2e', 'config.json');
  const e2eConfigFile = path.join(__dirname, '..', file);
  await fs.ensureFile(e2eConfigFile);
  const current = (await fs.readJson(e2eConfigFile, { throws: false })) || {};

  const e2eConfig = {
    ...current,
    ...config,
  };

  console.log(`Updating e2e tests ${file} with: ${JSON.stringify(e2eConfig)}`);

  await fs.writeJSON(e2eConfigFile, e2eConfig, { spaces: 2 });
};

module.exports = { updateE2eTestsConfig };
