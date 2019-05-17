export const listEvents = `query GetAllEntries {
    getDataEntries {
      items {
        id
        name
        url
        averageLatencyMs
        lastSample
        status
        logo
      }
    }
  }`;
