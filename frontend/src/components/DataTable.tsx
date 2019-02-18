import React from 'react';
import { Header, Icon, Image, Statistic, Table } from 'semantic-ui-react';

const parties: IRowProps[] = [
  {
    averageLatencyMs: 200,
    id: 'likud',
    lastSample: new Date(),
    logo:
      'https://www.idi.org.il/media/5955/likud.jpg?mode=crop&width=259&height=169',
    partyName: 'Likud',
    siteStatus: 'GREEN',
    siteUrl: 'https://www.likud.org.il/',
  },
];

interface IRowProps {
  averageLatencyMs: number;
  id: string;
  lastSample: Date;
  logo: string;
  partyName: string;
  siteStatus: string;
  siteUrl: string;
}

const SiteStatus = ({ status }: { status: string }) => {
  if (status === 'GREEN') {
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

const Row = (props: IRowProps) => {
  const {
    averageLatencyMs,
    id,
    lastSample,
    logo,
    partyName,
    siteStatus,
    siteUrl,
  } = props;
  return (
    <Table.Row key={id}>
      <Table.Cell>
        <Header as="h4" image={true}>
          <Image src={logo} />
          <Header.Content>{partyName}</Header.Content>
        </Header>
      </Table.Cell>
      <Table.Cell>{siteUrl}</Table.Cell>
      <SiteStatus status={siteStatus} />
      <Table.Cell>
        <Statistic horizontal={true} label="ms" value={averageLatencyMs} />
      </Table.Cell>
      <Table.Cell>{lastSample.toString()}</Table.Cell>
    </Table.Row>
  );
};

const DataTable = () => {
  return (
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

      <Table.Body>{parties.map(Row)}</Table.Body>
    </Table>
  );
};

export default DataTable;
