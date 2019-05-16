import { GraphQLResult } from '@aws-amplify/api/lib/types';
import { API, graphqlOperation } from 'aws-amplify';
import React, { useEffect, useReducer, useState } from 'react';
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

interface IDataError {
  message: string;
}

const ErrorMessages = ({ errors }: { errors: IDataError[] }) => (
  <Message
    error={true}
    header="Error loading data"
    list={errors.map(({ message }) => message)}
    data-testid="error-messages"
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

const sortEntries = (entries: DataEntry[]) => {
  return entries.sort((a, b) => a.name.localeCompare(b.name));
};

interface IState {
  entries: DataEntry[];
  errors?: IDataError[];
  loading: boolean;
}

const initialState: IState = { entries: [], loading: true };

export const reducer = (
  state: IState,
  action: { type: string; payload: any },
) => {
  switch (action.type) {
    case 'updateSingleEntry': {
      const entry = action.payload as DataEntry;
      const newEntries = [...state.entries];
      const index = newEntries.findIndex(e => e.id === entry.id);
      if (index >= 0) {
        newEntries.splice(index, 1);
      }
      newEntries.push(entry);
      return { ...state, entries: sortEntries(newEntries) };
    }
    case 'setAllEntries': {
      const newEntries = action.payload as DataEntry[];
      return { ...state, entries: sortEntries(newEntries) };
    }
    case 'setLoading': {
      const loading = action.payload as boolean;
      return { ...state, loading };
    }
    case 'setErrors': {
      const errors = action.payload as IDataError[];
      return { ...state, errors };
    }
    default: {
      return state;
    }
  }
};

const DataTable = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchData = async () => {
    try {
      const { data } = (await API.graphql(
        graphqlOperation(listEvents),
      )) as GraphQLResult;

      const result = data as Query;
      const getDataEntries = result.getDataEntries || { items: [] };

      dispatch({ type: 'setAllEntries', payload: getDataEntries.items });
    } catch ({ errors }) {
      dispatch({ type: 'setErrors', payload: errors });
    }

    dispatch({ type: 'setLoading', payload: false });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const subscription = (API.graphql(
      graphqlOperation(onUpdateDataEntry),
    ) as Observable<object>).subscribe({
      next: (result: { value: { data: Subscription } }) => {
        if (result.value.data.updateDataEntry) {
          const entry = result.value.data.updateDataEntry;
          dispatch({ type: 'updateSingleEntry', payload: entry });
        }
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  const { loading, errors, entries } = state;

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
      {errors ? <ErrorMessages errors={errors} /> : null}
    </Segment>
  );
};

export default DataTable;
