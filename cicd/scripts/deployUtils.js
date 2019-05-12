const readline = require('readline');
const { spawn, spawnSync } = require('child_process');
const { readJSON, readFile } = require('fs-extra');
const os = require('os');
const path = require('path');
const Project = require('@lerna/project');
const batchPackages = require('@lerna/batch-packages');
const { CloudFormation } = require('aws-sdk');
const yaml = require('js-yaml');

const FRONTEND = 'frontend';
const SERVICES = 'services';
const CICD = 'cicd';
const lerna = path.join('node_modules', '.bin', 'lerna');

const getChangedServices = commitId => {
  const result = spawnSync('git', [
    'diff-tree',
    '--no-commit-id',
    '--name-only',
    '-r',
    commitId,
  ]);

  const { stdout } = result;

  const changedFiles = stdout
    .toString()
    .trim()
    .split(os.EOL);

  const changedServices = changedFiles
    .filter(
      f =>
        f.startsWith(FRONTEND) || f.startsWith(SERVICES) || f.startsWith(CICD),
    )
    .map(f =>
      f.startsWith(SERVICES) ? f.slice(SERVICES.length + path.sep.length) : f,
    )
    .map(path.dirname);

  const unique = [...new Set(changedServices)].sort();

  return unique;
};

const getPackages = async () => {
  const project = new Project(process.cwd());
  const packages = await project.getPackages();
  return packages;
};

const getServerlessYamls = async () => {
  const project = new Project(process.cwd());
  const mapper = serverlessYaml => {
    const service = path
      .dirname(serverlessYaml)
      .split(path.sep)
      .pop();
    return { service, serverlessYaml };
  };

  const yamls = await project.fileFinder('serverless.yml', filePaths =>
    filePaths.map(mapper),
  );
  return yamls;
};

const getRegion = async stage => {
  const { region } = await readJSON(
    path.join(
      process.cwd(),
      'services',
      'common',
      'environment',
      `config.${stage}.json`,
    ),
  );
  return region;
};

const isStackExists = async (name, region) => {
  const cloudformation = new CloudFormation({ region });
  try {
    await cloudformation.describeStacks({ StackName: name }).promise();
    return true;
  } catch (e) {
    return false;
  }
};

const getNotDeployedServices = async (stage, region) => {
  const yamls = await getServerlessYamls();
  const services = await Promise.all(
    yamls.map(({ service, serverlessYaml }) => {
      return readFile(serverlessYaml).then(content => ({
        service,
        stack: `${yaml.safeLoad(content).service}-${stage}`,
      }));
    }),
  );
  const allStacks = await Promise.all(
    services.map(({ service, stack }) =>
      isStackExists(stack, region).then(exists => ({ service, exists })),
    ),
  );
  const notDeployed = allStacks
    .filter(({ exists }) => !exists)
    .map(({ service }) => service);

  return notDeployed;
};

const runSpawnCommand = async (command, args) => {
  const promise = new Promise(resolve => {
    const proc = spawn(command, args);

    const stdout = readline.createInterface({
      input: proc.stdout,
      terminal: false,
    });

    const stderr = readline.createInterface({
      input: proc.stderr,
      terminal: false,
    });

    stdout.on('line', line => {
      console.log(line);
    });

    stderr.on('line', line => {
      console.log(line);
    });

    proc.on('close', code => {
      resolve(code);
    });
  });

  return promise;
};

const batchCommand = async (packages, toDeploy, command) => {
  const batched = batchPackages(packages, true);
  for (const batch of batched) {
    await Promise.all(
      batch.map(({ name }) => {
        if (toDeploy.includes(name)) {
          if (name === CICD) {
            console.log(
              "Skipping command for 'CICD' service since it is a one time setup",
            );
            return Promise.resolve();
          }
          return command(name);
        } else {
          console.log('Skipping command for unchanged service', `'${name}'`);
          return Promise.resolve();
        }
      }),
    );
  }
};

const batchDeployCommand = async (packages, toDeploy, stage) => {
  await batchCommand(packages, toDeploy, name => {
    console.log('Deploying changed service', `'${name}'`);
    return runSpawnCommand(lerna, [
      'run',
      '--scope',
      name,
      'deploy',
      '--',
      '--stage',
      stage,
    ]);
  });
};

const batchE2ETestCommand = async (packages, toDeploy) => {
  await batchCommand(packages, toDeploy, name => {
    console.log('Running e2e tests for service', `'${name}'`);
    return runSpawnCommand(lerna, [
      'run',
      '--concurrency',
      1,
      '--scope',
      name,
      'test:e2e',
    ]);
  });
};

module.exports = {
  getChangedServices,
  getRegion,
  getNotDeployedServices,
  getPackages,
  batchDeployCommand,
  batchE2ETestCommand,
};
