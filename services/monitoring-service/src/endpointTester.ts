import axios from 'axios';

export const sendSingleRequest = async (endpoint: string) => {
  const start = new Date().getTime();
  let error = true;
  try {
    const { status } = await axios.get(endpoint);
    console.log('received status code:', status);
    error = false;
  } catch (e) {
    console.error(e);
    error = true;
  }
  const end = new Date().getTime();

  return { error, duration: end - start };
};

export const NUM_REQUESTS = 15;

export const testEndpoint = async (endpoint: string) => {
  const endpoints = new Array(NUM_REQUESTS).fill(endpoint);

  const results = await Promise.all(endpoints.map(sendSingleRequest));
  return results;
};
