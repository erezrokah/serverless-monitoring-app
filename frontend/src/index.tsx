import { Amplify } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import '@aws-amplify/ui/dist/style.css';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

Amplify.configure({
  Auth: {
    region: process.env.REACT_APP_COGNITO_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
  },
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_appsync_graphqlEndpoint: process.env.REACT_APP_GRAPHQL_API_URL,
  aws_appsync_region: process.env.REACT_APP_APPSYNC_REGION,
});

interface IState {
  component: any;
}

class LazyLoadApp extends React.Component<{}, IState, any> {
  public state: IState;

  constructor(props: any) {
    super(props);

    this.state = {
      component: null,
    };
  }

  public render() {
    const C = this.state.component;

    return C ? <C {...this.props} /> : null;
  }

  public async componentDidMount() {
    const { default: component } = await import('./App');

    this.setState({
      component,
    });
  }
}

// withAuthenticator(Comp, includeGreetings = false, authenticatorComponents = [], federated = null, theme = null, signUpConfig = {})
const AuthApp = withAuthenticator(LazyLoadApp, true, null, null, null, {
  hideAllDefaults: true,
  signUpFields: [
    {
      displayOrder: 1,
      key: 'username',
      label: 'Username',
      placeholder: 'Username',
      required: true,
    },
    {
      displayOrder: 2,
      key: 'password',
      label: 'Password',
      placeholder: 'Password',
      required: true,
      type: 'password',
    },
    {
      displayOrder: 3,
      key: 'email',
      label: 'Email',
      placeholder: 'Email',
      required: true,
      type: 'email',
    },
  ],
});

ReactDOM.render(<AuthApp />, document.getElementById('root') as HTMLElement);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
