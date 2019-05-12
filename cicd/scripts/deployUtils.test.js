const { getChangedServices } = require('./deployUtils');
const os = require('os');

jest.mock('child_process', () => {
  return { spawnSync: jest.fn() };
});

describe('deploy', () => {
  describe('getChangedServices', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    test('should return changed services directories', () => {
      const { spawnSync } = require('child_process');

      const changedFiles = [
        'cicd/serverless.yml',
        'cicd/scripts/deploy.js',
        'buildspec.yml',
        'frontend/deploy.js',
        'frontend/package.json',
        'package.json',
        'services/common/package.json',
        'services/monitoring-service/package.json',
        'services/monitoring-service/serverless.yml',
      ];
      spawnSync.mockReturnValueOnce({
        stdout: Buffer.from(changedFiles.join(os.EOL)),
        stderr: Buffer.from(''),
        status: 0,
      });

      const commitId = 'c152619a';

      const changed = getChangedServices(commitId);

      expect(spawnSync).toHaveBeenCalledTimes(1);
      expect(spawnSync).toHaveBeenCalledWith('git', [
        'diff-tree',
        '-m',
        '--no-commit-id',
        '--name-only',
        '-r',
        commitId,
      ]);
      expect(changed).toEqual(
        ['cicd', 'frontend', 'common', 'monitoring-service'].sort(),
      );
    });
  });
});
