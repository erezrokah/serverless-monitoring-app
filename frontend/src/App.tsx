import React, { Component } from 'react';
import { Button, Header, Segment } from 'semantic-ui-react';
import { DataTable } from './components';

class App extends Component<any, any> {
  public render() {
    return (
      <Segment>
        <Header textAlign="center" size="huge">
          Elections Monitoring App
        </Header>
        <DataTable />
      </Segment>
    );
  }
}

export default App;
