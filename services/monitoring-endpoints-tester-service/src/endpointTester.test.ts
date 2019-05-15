import * as MockDate from 'mockdate';
import { NUM_REQUESTS, testEndpoint } from './endpointTester';

jest.mock('axios');
jest.spyOn(console, 'log');
jest.spyOn(console, 'error');

const date = '1948/1/1';
MockDate.set(date);

describe('endpointTester', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call axios and return results no error', async () => {
    const axios = require('axios');

    const status = 200;
    axios.get.mockReturnValue(Promise.resolve({ status }));

    const url = 'url';
    const results = await testEndpoint(url);

    expect.assertions(5);

    expect(axios.get).toHaveBeenCalledTimes(NUM_REQUESTS);
    expect(axios.get).toHaveBeenCalledWith(url, { timeout: 10000 });
    expect(results).toEqual(
      new Array(NUM_REQUESTS).fill({ error: false, duration: 0 }),
    );
    expect(console.log).toHaveBeenCalledTimes(NUM_REQUESTS);
    expect(console.log).toHaveBeenCalledWith('received status code:', status);
  });

  test('should call axios and return results with errors', async () => {
    const axios = require('axios');

    const error = new Error('timeout');
    axios.get.mockReturnValue(Promise.reject(error));

    const url = 'url';
    const results = await testEndpoint(url);

    expect.assertions(5);

    expect(axios.get).toHaveBeenCalledTimes(NUM_REQUESTS);
    expect(axios.get).toHaveBeenCalledWith(url, { timeout: 10000 });
    expect(results).toEqual(
      new Array(NUM_REQUESTS).fill({ error: true, duration: 0 }),
    );
    expect(console.error).toHaveBeenCalledTimes(NUM_REQUESTS);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});
