const extractGithubData = require('./githubConfig');

jest.mock('child_process', () => {
  return { spawnSync: jest.fn() };
});

describe('githubConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const { spawnSync } = require('child_process');

  test('should return owner and repo on https url', () => {
    spawnSync.mockReturnValueOnce({
      stdout: Buffer.from('https://github.com/USERNAME/REPOSITORY.git'),
    });

    expect(extractGithubData()).toEqual({
      owner: 'USERNAME',
      repo: 'REPOSITORY',
    });
    expect(spawnSync).toHaveBeenCalledTimes(1);
    expect(spawnSync).toHaveBeenCalledWith('git', [
      'remote',
      'get-url',
      'origin',
    ]);
  });

  test('should return owner and repo on ssh url', () => {
    spawnSync.mockReturnValueOnce({
      stdout: Buffer.from('git@github.com:USERNAME/REPOSITORY.git'),
    });

    expect(extractGithubData()).toEqual({
      owner: 'USERNAME',
      repo: 'REPOSITORY',
    });
    expect(spawnSync).toHaveBeenCalledTimes(1);
    expect(spawnSync).toHaveBeenCalledWith('git', [
      'remote',
      'get-url',
      'origin',
    ]);
  });
});
