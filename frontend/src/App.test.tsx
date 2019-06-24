import { render } from '@testing-library/react';
import React from 'react';
import renderer from 'react-test-renderer';
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
