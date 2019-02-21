import { checkEndpoint } from './checkEndpointHandler';

jest.mock('./endpointTester');

describe('checkEndpointHandler', () => {
  test('should call testEndpoint and invoke callback', async () => {
    const { testEndpoint } = require('./endpointTester');

    const results = [{ error: false, duration: 1000 }];
    testEndpoint.mockReturnValue(results);

    const event = {
      id: 'id',
      logo: 'logo',
      name: 'name',
      url: 'url',
    };
    const callback = jest.fn();

    await checkEndpoint(event, null as any, callback);

    expect.assertions(4);

    expect(testEndpoint).toHaveBeenCalledTimes(1);
    expect(testEndpoint).toHaveBeenCalledWith(event.url);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(null, {
      ...event,
      results,
    });
  });
});
