import Base from '../Base';
import {
  render,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React from 'react';
import fetchMock from 'jest-fetch-mock';
import {act} from 'react-test-renderer';
import Geolocation from 'react-native-geolocation-service';
import {useDispatch} from 'react-redux';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import '@testing-library/jest-dom';
import {Button} from 'react-native';
declare var global: any;
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));
const timestamp = new Date(Date.now()).toLocaleString([], {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const navigation = useNavigation<NativeStackNavigationProp<any>>();
jest.mock('react-native-geolocation-service', () => {
  return {
    getCurrentPosition: jest.fn(success => {
      const location = {
        coords: {
          latitude: 17.3920466,
          longitude: 78.4758037,
        },
      };
      success(location);
    }),
  };
});
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: jest.fn().mockReturnValue({
      navigate: jest.fn(),
    }),
  };
});

describe('Locations List Screen/Base Component', () => {
  let latitude: number;
  let longitude: number;
  const mockDispatch = jest.fn();
  let useDispatchMock: jest.Mock;
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  beforeAll(async () => {
    await new Promise<void>(resolve => {
      Geolocation.getCurrentPosition(position => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        resolve();
      });
    });
  });
  const mockResponse = {
    results: [
      {
        formatted: '123 Main St, Anytown USA',
      },
    ],
  };
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve(mockResponse),
  });
  beforeEach(() => {
    fetchMock.mockReset();
    useDispatchMock = useDispatch as jest.Mock;
    useDispatchMock.mockReturnValue(mockDispatch);
  });

  it('renders the base component correctly', () => {
    render(<Base />);
    const currentLabel = screen.getByTestId('list-current-label');
    expect(currentLabel.props.children).toBe('Current Location');
  });
  it('should have the right location', () => {
    render(<Base />);
    expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
  });
  it('renders the current location time', async () => {
    const currentLocation = {
      address: 'unnamed road',
      time: timestamp,
      latitude: 42.123456,
      longitude: -71.123456,
    };
    const {getByTestId} = render(<Base />);
    const currentLocationTime = await waitFor(() =>
      getByTestId('list-current-time'),
    );
    expect(currentLocationTime.props.children).toBe(currentLocation.time);
  });
  test('displays current location', async () => {
    const mockResponse = {
      results: [
        {
          formatted: '123 Main St, Anytown USA',
        },
      ],
    };
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    const {getByTestId} = render(<Base />);

    await waitFor(() => {
      const currentLocationName = getByTestId('list-current-name');
      expect(currentLocationName.props.children).toBe(
        '123 Main St, Anytown USA',
      );
    });
  });
  it('renders the whole location item correctly', async () => {
    const currentLocation = {
      address: '123 Main St, Anytown USA',
      time: timestamp,
      latitude,
      longitude,
    };
    const {getByTestId} = render(<Base />);
    const currentLocationItem = await waitFor(() =>
      getByTestId('list-current-item'),
    );
    fireEvent.press(currentLocationItem);
    expect(navigation.navigate).toHaveBeenCalledWith('Map', {
      address: currentLocation,
    });
  });
  it('clears all locations on button press', async () => {
    const clearAllLocations = jest.fn();
    const {getByTestId} = render(
      <Button
        title="Clear All Locations"
        onPress={clearAllLocations}
        testID="list-clear-all-button"
      />,
    );
    const clearAllButton = await waitFor(() =>
      getByTestId('list-clear-all-button'),
    );
    await act(async () => {
      fireEvent.press(clearAllButton);
    });
    expect(clearAllLocations).toHaveBeenCalled();
  });
  it('renders the correct text for previous locations', () => {
    const previousLocations = [
      {
        address: '123 Main St',
        time: '2022-02-28 10:00 AM',
        latitude: 1.234567,
        longitude: -1.234567,
      },
      {
        address: '456 Elm St',
        time: '2022-02-28 11:00 AM',
        latitude: 2.345678,
        longitude: -2.345678,
      },
    ];
    const {getAllByTestId} = render(<Base />);
    const previousNameElements = getAllByTestId(/list-previous-name-/);
    expect(previousNameElements[0]).toHaveTextContent('123 Main St');
    expect(previousNameElements[1]).toHaveTextContent('456 Elm St');
  });
});
