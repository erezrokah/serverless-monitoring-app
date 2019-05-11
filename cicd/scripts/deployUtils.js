const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

const FRONTEND = 'frontend';
const SERVICES = 'services';

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
    .filter(f => f.startsWith(FRONTEND) || f.startsWith(SERVICES))
    .map(f =>
      f.startsWith(SERVICES) ? f.slice(SERVICES.length + os.EOL.length) : f,
    )
    .map(path.dirname);

  const unique = [...new Set(changedServices)].sort();

  return unique;
};

module.exports = { getChangedServices };
