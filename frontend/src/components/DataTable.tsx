import { GraphQLResult } from '@aws-amplify/api/lib/types';
import { API, graphqlOperation } from 'aws-amplify';
import React, { useEffect, useState } from 'react';
import {
  Header,
  Icon,
  Image,
  Message,
  Segment,
  Statistic,
  Table,
} from 'semantic-ui-react';
import * as Observable from 'zen-observable';
import { listEvents } from '../graphql/queries';
import { onUpdateDataEntry } from '../graphql/subscriptions';
import { DataEntry, Query, Subscription } from '../graphql/types';

const emptyEntry: DataEntry = {
  averageLatencyMs: 1,
  id: 'id',
  lastSample: '1',
  logo: 'logo',
  name: 'name',
  status: 'ERROR',
  url: 'url',
};

interface IDataError {
  message: string;
}

const MessageError = ({ errors }: { errors: IDataError[] }) => (
  <Message
    error={true}
    header="Error loading data"
    list={errors.map(({ message }) => message)}
  />
);

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
    return <Table.Cell>Unknown</Table.Cell>;
  }
};

const Row = (props: DataEntry) => {
  const { averageLatencyMs, id, lastSample, logo, name, status, url } = props;
  const lastSampleDate = new Date(lastSample);

  return (
    <Table.Row key={id} data-testid={id}>
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

const setSortedEntries = (
  entries: DataEntry[],
  setEntries: React.Dispatch<React.SetStateAction<DataEntry[]>>,
) => {
  setEntries(entries.sort((a, b) => a.name.localeCompare(b.name)));
};

const DataTable = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([] as DataEntry[]);
  const [errors, setErrors] = useState(null);

  const fetchData = async () => {
    try {
      const { data } = (await API.graphql(
        graphqlOperation(listEvents),
      )) as GraphQLResult;

      const result = data as Query;
      const getDataEntries = result.getDataEntries || { items: [] };

      setSortedEntries(getDataEntries.items, setEntries);
    } catch ({ errors }) {
      setErrors(errors);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const subscription = (API.graphql(
      graphqlOperation(onUpdateDataEntry),
    ) as Observable<object>).subscribe({
      next: (result: { value: { data: Subscription } }) => {
        const entry = result.value.data.updateDataEntry || emptyEntry;
        const index = entries.findIndex(e => e.id === entry.id);
        if (index >= 0) {
          entries.splice(index, 1);
        }
        setSortedEntries([...entries, entry], setEntries);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Segment loading={loading} basic={true}>
      <Table celled={true} data-testid="data-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Party Name</Table.HeaderCell>
            <Table.HeaderCell>Site Address</Table.HeaderCell>
            <Table.HeaderCell>Site Status</Table.HeaderCell>
            <Table.HeaderCell>Average Latency</Table.HeaderCell>
            <Table.HeaderCell>Latest Sample</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>{entries.map(Row)}</Table.Body>
      </Table>
      {errors ? <MessageError errors={errors} /> : null}
    </Segment>
  );
};

export default DataTable;
