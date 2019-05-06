const { spawnSync } = require('child_process');

const extractGithubData = () => {
  const result = spawnSync('git', ['remote', 'get-url', 'origin']);
  const { stdout } = result;

  // https://github.com/USERNAME/REPOSITORY.git
  // or
  // git@github.com:USERNAME/REPOSITORY.git
  // to USERNAME/REPOSITORY.git
  const stripped = stdout
    .toString()
    .split('github.com')[1]
    .substring(1);

  // splits USERNAME/REPOSITORY.git
  const parts = stripped.split('/');
  const githubOwner = parts[0];
  const githubRepo = parts[1].split('.')[0];

  return {
    githubOwner,
    githubRepo,
  };
};

const extractRegion = serverless => {
  const { stage: inputStage } = serverless.processedInput.options;
  const { defaultStage } = serverless.variables.service.custom;
  const stage = inputStage || defaultStage;
  const result = spawnSync('aws', [
    'ssm',
    'get-parameter',
    '--name',
    `region-${stage}`,
  ]);
  const { stdout } = result;
  const parameter = JSON.parse(stdout);
  return parameter.Parameter.Value;
};

const getConfig = serverless => {
  const githubData = extractGithubData();
  const region = extractRegion(serverless);

  return {
    ...githubData,
    region,
  };
};

module.exports = getConfig;
