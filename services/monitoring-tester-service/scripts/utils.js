const path = require('path');
const { readFile, writeFile } = require('fs/promises');

const readJson = async (file) => {
  try {
    const content = await readFile(file, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
};

const updateE2eTestsConfig = async (config) => {
  const e2eConfigFile = `${__dirname}/../e2e/config.json`;
  const current = await readJson(e2eConfigFile);

  const e2eConfig = {
    ...current,
    ...config,
  };

  const stringified = JSON.stringify(e2eConfig, null, 2);
  console.log(
    `Updating e2e tests ${path.basename(e2eConfigFile)} with: ${stringified}`,
  );
  await writeFile(e2eConfigFile, stringified);
};

module.exports = { updateE2eTestsConfig };
