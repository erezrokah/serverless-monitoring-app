import React, { Component } from 'react';
import { Header, Segment } from 'semantic-ui-react';
import { DataTable, Refresh } from './components';

class App extends Component<any, any> {
  public render() {
    return (
      <Segment>
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
