export const ListEvents = `query GetAllEntries {
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
