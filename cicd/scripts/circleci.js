// https://circleci.com/account/api
const { spawnSync } = require('child_process');
const { EOL } = require('os');

const { error, log } = require('./log');
const yargs = require('yargs');
const axios = require('axios');
const { IAM } = require('aws-sdk');

const api = 'https://circleci.com/api/v1.1/project/github';
const policyArn = 'arn:aws:iam::aws:policy/AdministratorAccess';

const getIamUserName = repo => `circle-ci-${repo}`;

const deleteAllKeys = async userName => {
  log(`Deleting all access keys for user ${userName}`);
  const iam = new IAM();
  const result = await iam.listAccessKeys({ UserName: userName }).promise();

  await Promise.all(
    result.AccessKeyMetadata.map(({ UserName, AccessKeyId }) =>
      iam.deleteAccessKey({ UserName, AccessKeyId }).promise(),
    ),
  );
  log(`Done deleting all access keys for user ${userName}`);
};

const createIamUser = async userName => {
  const iam = new IAM();

  try {
    log(`Creating IAM user ${userName}`);
    await iam.createUser({ UserName: userName }).promise();
    log(`Done creating IAM user ${userName}`);
  } catch (e) {
    if (e.code === 'EntityAlreadyExists') {
      log(`User ${userName} already exists`);
      await deleteAllKeys(userName);
    } else {
      throw e;
    }
  }

  log(`Attaching managed policy to user ${userName}`);
  await iam
    .attachUserPolicy({
      PolicyArn: policyArn,
      UserName: userName,
    })
    .promise();
  log(`Done attaching managed policy to user ${userName}`);

  log(`Creating access key for user ${userName}`);
  const { AccessKey } = await iam
    .createAccessKey({ UserName: userName })
    .promise();
  const {
    AccessKeyId: accessKeyId,
    SecretAccessKey: secretAccessKey,
  } = AccessKey;
  log(`Done creating access key for user ${userName}`);
  return { accessKeyId, secretAccessKey };
};

const deleteIamUser = async userName => {
  const iam = new IAM();

  try {
    log(`Detaching IAM user ${userName} policy ${policyArn}`);
    await iam
      .detachUserPolicy({
        PolicyArn: policyArn,
        UserName: userName,
      })
      .promise();
    log(`Done detaching IAM user ${userName} policy ${policyArn}`);

    await deleteAllKeys(userName);

    log(`Deleting IAM user ${userName}`);
    await iam.deleteUser({ UserName: userName }).promise();
    log(`Done deleting IAM user ${userName}`);
  } catch (e) {
    if (e.code === 'NoSuchEntity') {
      log(`Policy ${policyArn} doesn't exists`);
    } else {
      throw e;
    }
  }
};

const follow = async (token, owner, repo) => {
  log(`Following repo ${repo} under owner ${owner}`);
  const result = await axios.post(
    `${api}/${owner}/${repo}/follow?circle-token=${token}`,
  );
  const { following } = result.data;
  if (following) {
    log(`Successfully followed repo ${repo} under owner ${owner}`);
  } else {
    const message = `Failed to follow repo ${repo} under owner ${owner}`;
    error(message);
    throw new Error(message);
  }
};

const setEnvs = async (token, owner, repo, envs) => {
  log(`Deleting existing environment vars for project ${repo}`);
  const { data: existing } = await axios.get(
    `${api}/${owner}/${repo}/envvar?circle-token=${token}`,
  );
  await Promise.all(
    existing.map(({ name }) =>
      axios.delete(
        `${api}/${owner}/${repo}/envvar/${name}?circle-token=${token}`,
      ),
    ),
  );
  log(`Done deleting existing environment vars for project ${repo}`);

  log(`Setting environment vars for project ${repo}`);
  await Promise.all(
    envs.map(({ name, value }) =>
      axios.post(`${api}/${owner}/${repo}/envvar?circle-token=${token}`, {
        name,
        value,
      }),
    ),
  );
  log(`Successfully set environment vars for project ${repo}`);
};

const updateProjectSettings = async (token, owner, repo) => {
  log(`Updating settings for project ${repo}`);
  await axios.put(`${api}/${owner}/${repo}/settings?circle-token=${token}`, {
    feature_flags: { 'build-prs-only': true },
  });
  log(`Done updating settings for project ${repo}`);
};

const setup = async (token, envs) => {
  try {
    const { owner, repo } = require('./githubConfig')();
    const iamUser = getIamUserName(repo);
    const { accessKeyId, secretAccessKey } = await createIamUser(iamUser);

    await follow(token, owner, repo);
    await setEnvs(token, owner, repo, [
      ...envs,
      { name: 'AWS_ACCESS_KEY_ID', value: accessKeyId },
      { name: 'AWS_SECRET_ACCESS_KEY', value: secretAccessKey },
    ]);
    await updateProjectSettings(token, owner, repo);
  } catch (e) {
    error(e);
    process.exit(1);
  }
};

const unfollow = async (token, owner, repo) => {
  log(`Unfollowing repo ${repo} under owner ${owner}`);
  const result = await axios.post(
    `${api}/${owner}/${repo}/unfollow?circle-token=${token}`,
  );
  const { following } = result.data;
  if (!following) {
    log(`Successfully unfollowed repo ${repo} under owner ${owner}`);
  } else {
    const message = `Failed to unfollow repo ${repo} under owner ${owner}`;
    error(message);
    throw new Error(message);
  }
};

const remove = async token => {
  try {
    const { owner, repo } = require('./githubConfig')();
    await unfollow(token, owner, repo);

    const iamUser = getIamUserName(repo);
    await deleteIamUser(iamUser);
  } catch (e) {
    error(e);
    process.exit(1);
  }
};

const getLatestTag = (owner, repo) => {
  const result = spawnSync('git', [
    'ls-remote',
    '--tags',
    '--sort=v:refname',
    `git://github.com/${owner}/${repo}.git`,
  ]);
  const { stdout } = result;
  const lines = stdout
    .toString()
    .trim()
    .split(EOL);
  const tag = lines[lines.length - 1].split('/')[2];
  return tag;
};

const triggerBuild = async (token, stage) => {
  const { owner, repo } = require('./githubConfig')();

  try {
    // https://circleci.com/docs/api/#trigger-a-new-build-by-project-preview

    const options =
      stage === 'prod'
        ? { tag: getLatestTag(owner, repo) }
        : { branch: 'master' };

    log(`Triggering manual build for repo ${repo} under owner ${owner}`);
    await axios.post(
      `${api}/${owner}/${repo}/build?circle-token=${token}`,
      options,
    );
    log(`Done triggering manual build for repo ${repo} under owner ${owner}`);
  } catch (e) {
    error(e);
    process.exit(1);
  }
};

yargs
  .command({
    command: 'setup',
    aliases: ['s'],
    desc: 'Setup circle ci project',
    builder: yargs =>
      yargs
        .option('token', {
          alias: 't',
          describe: 'Api Token',
          demandOption: true,
          string: true,
          requiresArg: true,
        })
        .option('stagingRegion', {
          alias: 'sr',
          describe: 'Staging Region',
          demandOption: true,
          string: true,
          requiresArg: true,
        })
        .option('prodRegion', {
          alias: 'pr',
          describe: 'Production Region',
          demandOption: true,
          string: true,
          requiresArg: true,
        })
        .option('stagingAdminEmail', {
          alias: 'sae',
          describe: 'Staging Admin Email',
          demandOption: true,
          string: true,
          requiresArg: true,
        })
        .option('prodAdminEmail', {
          alias: 'pae',
          describe: 'Production Admin Email',
          demandOption: true,
          string: true,
          requiresArg: true,
        }),
    handler: async ({
      token,
      stagingRegion,
      prodRegion,
      stagingAdminEmail,
      prodAdminEmail,
    }) => {
      const envs = [
        { name: 'STAGING_REGION', value: stagingRegion },
        { name: 'STAGING_ADMIN_EMAIL', value: stagingAdminEmail },
        { name: 'PROD_REGION', value: prodRegion },
        { name: 'PROD_ADMIN_EMAIL', value: prodAdminEmail },
      ];
      await setup(token, envs);
    },
  })
  .command({
    command: 'remove',
    aliases: ['r'],
    desc: 'Remove circle ci project setup',
    builder: yargs =>
      yargs.option('token', {
        alias: 't',
        describe: 'Api Token',
        demandOption: true,
        string: true,
        requiresArg: true,
      }),
    handler: async ({ token }) => {
      await remove(token);
    },
  })
  .command({
    command: 'trigger',
    aliases: ['t'],
    desc: 'Trigger a manual build',
    builder: yargs =>
      yargs
        .option('token', {
          alias: 't',
          describe: 'Api Token',
          demandOption: true,
          string: true,
          requiresArg: true,
        })
        .option('stage', {
          alias: 's',
          describe: 'Deployment stage',
          demandOption: true,
          string: true,
          requiresArg: true,
          choices: ['staging', 'prod'],
        }),
    handler: async ({ token, stage }) => {
      await triggerBuild(token, stage);
    },
  })
  .demandCommand(1)
  .help()
  .strict()
  .version('0.0.1').argv;
