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
      });

      const commitId = 'c152619a';

      const changed = getChangedServices(commitId);

      expect(spawnSync).toHaveBeenCalledTimes(1);
      expect(spawnSync).toHaveBeenCalledWith('git', [
        'diff-tree',
        '--no-commit-id',
        '--name-only',
        '-r',
        commitId,
      ]);
      expect(changed).toEqual(
        ['frontend', 'common', 'monitoring-service'].sort(),
      );
    });
  });
});
