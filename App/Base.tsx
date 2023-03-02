import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
  Alert,
  Button,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {useDispatch} from 'react-redux';
import {addLocation} from './reducers/action';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {initializeLocations} from './reducers/index';
export default function Base() {
  const dispatch = useDispatch();
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [previousLocations, setPreviousLocations] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<any[]>([]);
  const timestamp = new Date(Date.now()).toLocaleString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const getLocation = async (latitude: number, longitude: number) => {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=1b2f48e99d8a47c0aa3cbf25072a699b`;
    try {
      const resultSet = await fetch(url);
      const json = await resultSet.json();
      if (json.results && json.results.length > 0) {
        return json.results[0].formatted;
      } else {
        console.error('No results found');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This application needs the device location',
            buttonPositive: 'ok',
            buttonNegative: 'Denied',
            buttonNeutral: 'Ask me later',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied');
          return;
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchLocation = async () => {
    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;
        const address = await getLocation(latitude, longitude);
        const newLocation = {
          address,
          time: timestamp,
          latitude: latitude,
          longitude: longitude,
        };
        dispatch(addLocation(newLocation));
        setLocationsList(prevLocations => {
          const updatedLocations = [newLocation, ...prevLocations];
          if (updatedLocations.length > 30) {
            updatedLocations.splice(30, updatedLocations.length - 30);
          }
          return updatedLocations;
        });
        try {
          await fetch(`https://httpstat.us/200`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location_name: newLocation.address,
              time: Date.now(),
            }),
          });
        } catch (error) {
          console.error(error);
        }
      },
      error => {
        console.log(error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );
  };
  useEffect(() => {
    requestLocationPermission();
    fetchLocation();
    dispatch(initializeLocations(locationsList));
    const interval = setInterval(() => {
      fetchLocation();
    }, 300000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (locationsList.length > 0) {
      setCurrentLocation(locationsList[0]);
      setPreviousLocations(locationsList.slice(1));
    }
  }, [locationsList]);
  const clearAllLocations = () => {
    setPreviousLocations([]);
  };
  const clearLocation = (index: number) => {
    const newLocations = [...previousLocations];
    newLocations.splice(index, 1);
    setPreviousLocations(newLocations);
  };
  const handleLocationNavigation = (currentLocation: any) => {
    console.log('Pressed');
    navigation.navigate('Map', {address: currentLocation});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.textHeaders} testID="list-current-label">
        Current Location
      </Text>
      {currentLocation && (
        <View>
          <TouchableOpacity
            testID="list-current-item"
            onPress={() => handleLocationNavigation(currentLocation)}>
            <Text
              style={{color: 'black', fontSize: 16}}
              testID="list-current-name">
              {currentLocation.address}
            </Text>
            <Text testID="list-current-time">{currentLocation.time}</Text>
          </TouchableOpacity>
        </View>
      )}
      <Button
        title="Clear All Locations"
        onPress={clearAllLocations}
        testID="list-clear-all-button"
      />
      <Text style={styles.textHeaders}>Previous Locations</Text>
      <ScrollView>
        {previousLocations.map((location, index) => (
          <View key={index} style={styles.locationItem}>
            <TouchableOpacity
              onPress={() => handleLocationNavigation(currentLocation)}>
              <View style={styles.locationText}>
                <Text
                  style={{color: 'black', fontSize: 16}}
                  testID={`list-previous-name-${index}`}>
                  {location.address}
                </Text>
                <Text testID={`list-previous-time-${index}`}>
                  {location.time}
                </Text>
              </View>
            </TouchableOpacity>
            <Pressable
              testID={`list-previous-remove-${index}`}
              onPress={() => clearLocation(index)}
              style={styles.pressableStyles}>
              <Text style={{color: 'black'}}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 0,
    padding: 16,
    backgroundColor: 'white',
  },
  textHeaders: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    width: 330,
    left: 0,
    marginHorizontal: 10,
  },
  locationText: {
    flex: 1,
    marginRight: 8,
  },
  pressableStyles: {
    backgroundColor: '#F3F3F3',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
