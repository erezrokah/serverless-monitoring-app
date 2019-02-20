import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { Header, Segment } from 'semantic-ui-react';
import { DataTable, Refresh } from './components';

class App extends Component<any, any> {
  public render() {
    return (
      <Segment>
        <Helmet>
          <title>Elections Monitoring App</title>
        </Helmet>
        <Header textAlign="center" size="huge">
          Elections Monitoring App
        </Header>
        <DataTable />
        <Refresh />
      </Segment>
    );
  }
}

export default App;
