import axios from 'axios';

export const sendSingleRequest = async (endpoint: string) => {
  const start = Date.now();
  let error = true;
  try {
    const { status } = await axios.get(endpoint, { timeout: 10000 });
    console.log('received status code:', status);
    error = false;
  } catch (e) {
    console.error(e);
    error = true;
  }
  const end = Date.now();

  return { error, duration: end - start };
};

export const NUM_REQUESTS = 15;

export const testEndpoint = async (endpoint: string) => {
  const endpoints = new Array(NUM_REQUESTS).fill(endpoint);

  const results = await Promise.all(endpoints.map(sendSingleRequest));
  return results;
};
