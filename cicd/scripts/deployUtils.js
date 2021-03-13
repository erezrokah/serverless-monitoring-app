const readline = require('readline');
const { spawn, spawnSync } = require('child_process');
const { readJSON, readFile } = require('fs-extra');
const os = require('os');
const path = require('path');
const Project = require('@lerna/project');
const batchPackages = require('@lerna/batch-packages');
const { CloudFormation } = require('aws-sdk');
const yaml = require('js-yaml');
const { log, error } = require('./log');

const FRONTEND = 'frontend';
const SERVICES = 'services';
const CICD = 'cicd';
const lerna = path.join('node_modules', '.bin', 'lerna');

const getChangedServices = (commitId) => {
  const result = spawnSync('git', [
    'diff-tree',
    '-m',
    '--no-commit-id',
    '--name-only',
    '-r',
    commitId,
  ]);

  const { stdout, stderr, status } = result;
  const err = stderr.toString();
  if (err) {
    error("Failed running 'diff-tree':", err);
  }
  if (status) {
    throw new Error("'diff-tree' command exited with status: " + status);
  }

  const changedFiles = stdout.toString().trim().split(os.EOL);

  const changedServices = changedFiles
    .filter(
      (f) =>
        f.startsWith(FRONTEND) || f.startsWith(SERVICES) || f.startsWith(CICD),
    )
    .map((f) =>
      f.startsWith(SERVICES) ? f.slice(SERVICES.length + path.sep.length) : f,
    )
    .map((file) => path.dirname(file).split(path.sep)[0]);

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
  const mapper = (serverlessYaml) => {
    const service = path.dirname(serverlessYaml).split(path.sep).pop();
    return { service, serverlessYaml };
  };

  const yamls = await project.fileFinder('serverless.yml', (filePaths) =>
    filePaths.map(mapper),
  );
  return yamls;
};

const getRegion = async (stage) => {
  const { region } = await readJSON(
    path.join(
      process.cwd(),
      'services',
      'monitoring-common',
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

const getAllStacks = async (stage, region) => {
  const yamls = await getServerlessYamls();
  const services = await Promise.all(
    yamls.map(({ service, serverlessYaml }) => {
      return readFile(serverlessYaml).then((content) => ({
        service,
        stack: `${yaml.load(content).service}-${stage}`,
      }));
    }),
  );
  const allStacks = await Promise.all(
    services.map(({ service, stack }) =>
      isStackExists(stack, region).then((exists) => ({ service, exists })),
    ),
  );
  return allStacks;
};

const getNotDeployedServices = async (stage, region) => {
  const allStacks = await getAllStacks(stage, region);
  const notDeployed = allStacks
    .filter(({ exists }) => !exists)
    .map(({ service }) => service);

  return notDeployed;
};

const getDeployedServices = async (stage, region) => {
  const allStacks = await getAllStacks(stage, region);
  const deployed = allStacks
    .filter(({ exists }) => exists)
    .map(({ service }) => service);

  return deployed;
};

const runSpawnCommand = async (command, args) => {
  const promise = new Promise((resolve, reject) => {
    const proc = spawn(command, args);

    const stdout = readline.createInterface({
      input: proc.stdout,
      terminal: false,
    });

    const stderr = readline.createInterface({
      input: proc.stderr,
      terminal: false,
    });

    stdout.on('line', (line) => {
      console.log(line);
    });

    stderr.on('line', (line) => {
      console.log(line);
    });

    proc.on('close', (code) => {
      if (code) {
        reject(code);
      } else {
        resolve(code);
      }
    });
  });

  return promise;
};

const batchCommand = async (batched, toProcess, command) => {
  for (const batch of batched) {
    await Promise.all(
      batch.map(({ name }) => {
        if (toProcess.includes(name)) {
          return command(name);
        } else {
          return Promise.resolve();
        }
      }),
    );
  }
};

const batchDeployCommand = async (packages, toDeploy, stage) => {
  log('Deploying services');
  const batched = batchPackages(packages, true);
  await batchCommand(batched, toDeploy, (name) => {
    log('Deploying service', `'${name}'`);
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
  log('Done deploying services');
};

const batchE2ETestCommand = async (packages, toTest) => {
  log('Running e2e tests');
  const batched = batchPackages(packages, true);
  await batchCommand(batched, toTest, (name) => {
    log('Running e2e tests for service', `'${name}'`);
    return runSpawnCommand(lerna, [
      'run',
      '--concurrency',
      1,
      '--scope',
      name,
      'test:e2e',
    ]);
  });
  log('Done running e2e tests');
};

const batchRemoveCommand = async (packages, toRemove, stage) => {
  log('Removing services');
  const batched = batchPackages(packages, true).reverse();
  await batchCommand(batched, toRemove, (name) => {
    log('Removing service', `'${name}'`);
    return runSpawnCommand(lerna, [
      'run',
      '--scope',
      name,
      'remove',
      '--',
      '--stage',
      stage,
    ]);
  });
  log('Done removing services');
};

module.exports = {
  getChangedServices,
  getRegion,
  getNotDeployedServices,
  getDeployedServices,
  getPackages,
  batchDeployCommand,
  batchE2ETestCommand,
  batchRemoveCommand,
  CICD,
};
