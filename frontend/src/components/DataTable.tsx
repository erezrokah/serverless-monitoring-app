import { GraphQLResult } from '@aws-amplify/api/lib/types';
import { API, graphqlOperation } from 'aws-amplify';
import React, { useEffect, useState } from 'react';
import {
  Dimmer,
  Header,
  Icon,
  Image,
  Loader,
  Segment,
  Statistic,
  Table,
} from 'semantic-ui-react';
import { ListEvents } from '../queries';

interface IEntry {
  id: string;
  name: string;
  url: string;
  averageLatencyMs: number;
  lastSample: string;
  status: string;
  logo: string;
}

interface IGraphQlResult {
  getDataEntries: { items: IEntry[] };
}

const SiteStatus = ({ status }: { status: string }) => {
  if (status === 'PASS') {
    return (
      <Table.Cell positive={true}>
        <Icon name="checkmark" />
        Passing
      </Table.Cell>
    );
  } else if (status === 'WARNING') {
    return (
      <Table.Cell warning={true}>
        <Icon name="attention" />
        Warning
      </Table.Cell>
    );
  } else if (status === 'ERROR') {
    return (
      <Table.Cell error={true}>
        <Icon name="close" />
        Error
      </Table.Cell>
    );
  } else {
    return null;
  }
};

const Row = (props: IEntry) => {
  const { averageLatencyMs, id, lastSample, logo, name, status, url } = props;
  const lastSampleDate = new Date(lastSample);
  return (
    <Table.Row key={id}>
      <Table.Cell>
        <Header as="h4" image={true}>
          <Image src={logo} />
          <Header.Content>{name}</Header.Content>
        </Header>
      </Table.Cell>
      <Table.Cell>{url}</Table.Cell>
      <SiteStatus status={status} />
      <Table.Cell>
        <Statistic
          horizontal={true}
          label="ms"
          value={averageLatencyMs.toFixed(2)}
        />
      </Table.Cell>
      <Table.Cell>{lastSampleDate.toString()}</Table.Cell>
    </Table.Row>
  );
};

const DataTable = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([] as IEntry[]);

  const fetchData = async () => {
    const { data = { getDataEntries: { items: [] } } } = (await API.graphql(
      graphqlOperation(ListEvents),
    )) as GraphQLResult;

    const result = data as IGraphQlResult;

    setEntries(
      result.getDataEntries.items.sort((a, b) => a.name.localeCompare(b.name)),
    );
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Segment loading={loading} basic={true}>
      <Table celled={true}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Party Name</Table.HeaderCell>
            <Table.HeaderCell>Site Address</Table.HeaderCell>
            <Table.HeaderCell>Site Status</Table.HeaderCell>
            <Table.HeaderCell>Average Latency</Table.HeaderCell>
            <Table.HeaderCell>Last Sample</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>{entries.map(Row)}</Table.Body>
      </Table>
    </Segment>
  );
};

export default DataTable;
