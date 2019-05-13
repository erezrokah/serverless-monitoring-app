const {
  getChangedServices,
  getRegion,
  getNotDeployedServices,
  getDeployedServices,
  getPackages,
  batchDeployCommand,
  batchE2ETestCommand,
  batchRemoveCommand,
  CICD,
} = require('./deployUtils');
const { error, warning, info, log } = require('./log');
const yargs = require('yargs');

const deploy = async (stage, commitId) => {
  try {
    log('Received deploy arguments:', `stage=${stage}, commitId=${commitId}`);

    const changed = getChangedServices(commitId);

    info('Changed services:', JSON.stringify(changed));

    const region = await getRegion(stage);

    const notDeployed = await getNotDeployedServices(stage, region);

    info('Not deployed services:', JSON.stringify(notDeployed));

    if (changed.includes(CICD) || notDeployed.includes(CICD)) {
      warning(
        `If you've made changes to ${CICD} service make sure to setup it again (as a one time setup)`,
      );
    }

    const toDeploy = [...new Set([...changed, ...notDeployed])].filter(
      service => service !== CICD,
    );

    info('Services to deploy:', JSON.stringify(toDeploy));

    if (toDeploy.length > 0) {
      const packages = await getPackages();
      await batchDeployCommand(packages, toDeploy, stage);

      if (stage !== 'prod') {
        await batchE2ETestCommand(packages, toDeploy, stage);
      } else {
        info('Not running e2e tests for stage:', stage);
      }
    } else {
      info('No services to deploy');
    }
  } catch (e) {
    error(e.message);
    process.exit(1);
  }
};

const remove = async stage => {
  try {
    log('Received remove arguments:', `stage=${stage}`);

    const region = await getRegion(stage);

    const deployed = await getDeployedServices(stage, region);

    info('Deployed services:', JSON.stringify(deployed));

    if (deployed.length > 0) {
      const packages = await getPackages();
      await batchRemoveCommand(packages, deployed, stage);
    } else {
      info('No services to remove');
    }
  } catch (e) {
    error(e.message);
    process.exit(1);
  }
};

yargs
  .command({
    command: 'deploy',
    aliases: ['d'],
    desc: 'Deploy services',
    builder: yargs =>
      yargs
        .option('stage', {
          alias: 's',
          describe: 'Stage',
          demandOption: true,
          string: true,
          requiresArg: true,
        })
        .option('commitId', {
          alias: 'c',
          describe: 'Commit Id',
          demandOption: true,
          string: true,
          requiresArg: true,
        })
        .check(({ commitId }) => {
          if (!commitId.match(/\b[0-9a-f]{5,40}\b/)) {
            throw new Error(`'${commitId}' must be a valid commitId`);
          }
          return true;
        }),
    handler: async ({ stage, commitId }) => {
      await deploy(stage, commitId);
    },
  })
  .command({
    command: 'remove',
    aliases: ['r'],
    desc: 'Remove all services',
    builder: yargs =>
      yargs.option('stage', {
        alias: 's',
        describe: 'Stage',
        demandOption: true,
        string: true,
        requiresArg: true,
      }),
    handler: async ({ stage }) => {
      await remove(stage);
    },
  })
  .demandCommand(1)
  .help()
  .strict()
  .version('0.0.1').argv;
