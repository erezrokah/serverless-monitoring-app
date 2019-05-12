const {
  getChangedServices,
  getRegion,
  getNotDeployedServices,
  getPackages,
  batchDeployCommand,
  batchE2ETestCommand,
} = require('./deployUtils');

const deploy = async () => {
  const argv = require('minimist')(process.argv.slice(2));
  const { stage, commitId } = argv;

  if (!stage) {
    console.error('Missing stage argument for deploy');
    process.exit(1);
  }
  if (!commitId || !commitId.match(/\b[0-9a-f]{5,40}\b/)) {
    console.error('Invalid commitId argument:', commitId);
    process.exit(1);
  }

  console.log(
    'Running deploy with arguments:',
    `stage=${stage}, commitId=${commitId}`,
  );

  const changed = getChangedServices(commitId);
  console.log('Changed services:', JSON.stringify(changed));

  const region = await getRegion(stage);

  const notDeployed = await getNotDeployedServices(stage, region);

  console.log('Not deployed services:', JSON.stringify(notDeployed));

  const toDeploy = [...new Set([...changed, ...notDeployed])];

  console.log('Services to deploy:', JSON.stringify(toDeploy));

  const packages = await getPackages();

  await batchDeployCommand(packages, toDeploy, stage);
  await batchE2ETestCommand(packages, toDeploy, stage);
};

deploy();
