export const aggregate = (results: IResultsData[]) => {
  const errors = results.filter((r) => r.error);
  if (errors.length >= results.length / 3) {
    return {
      averageLatencyMs: -1,
      lastSample: new Date().toISOString(),
      status: 'ERROR',
    };
  }
  const noErrors = results.filter((r) => !r.error);
  const sum = noErrors.map((r) => r.duration).reduce((a, b) => a + b, 0);
  const average = sum / noErrors.length;
  return {
    averageLatencyMs: average,
    lastSample: new Date().toISOString(),
    status: average >= 2000 ? 'WARNING' : 'PASS',
  };
};
