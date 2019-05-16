interface IEndpointData {
  id: string;
  url: string;
  name: string;
  logo: string;
}

interface IResultsData {
  error: boolean;
  duration: number;
}

interface IAggregatorData extends IEndpointData {
  results: IResultsData[];
}

interface IAggregatedResults extends IEndpointData {
  averageLatencyMs: number;
  lastSample: string;
  status: string;
}
