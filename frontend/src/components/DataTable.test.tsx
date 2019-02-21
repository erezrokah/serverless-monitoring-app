import React from 'react';
import renderer from 'react-test-renderer';
import { render } from 'react-testing-library';
import DataTable from './DataTable';

describe('DataTable', () => {
  test('renders without crashing', () => {
    const { getByText } = render(<DataTable />);
    expect(getByText('Party Name')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const tree = renderer.create(<DataTable />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
