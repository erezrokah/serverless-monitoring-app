import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import { render } from 'react-testing-library';
import Refresh from './Refresh';

describe('Refresh', () => {
  test('renders without crashing', () => {
    const { getByText } = render(<Refresh />);
    expect(getByText('Refresh')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const tree = renderer.create(<Refresh />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
