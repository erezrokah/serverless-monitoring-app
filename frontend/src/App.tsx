import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { Header, Segment } from 'semantic-ui-react';
import { DataTable, Refresh } from './components';
import './semanticUI';

const title = 'Elections Monitoring App';

class App extends Component<any, any> {
  public render() {
    return (
      <Segment>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <Header textAlign="center" size="huge">
          {title}
        </Header>
        <DataTable />
        <Refresh />
      </Segment>
    );
  }
}

export default App;
