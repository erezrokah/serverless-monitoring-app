import React from 'react';
import renderer from 'react-test-renderer';
import { render } from 'react-testing-library';
import App from './App';

jest.mock('./components', () => {
  return {
    DataTable: () => 'DataTable',
    Refresh: () => 'Refresh',
  };
});

describe('App', () => {
  test('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('Elections Monitoring App')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const tree = renderer.create(<App />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
