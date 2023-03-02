import React from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
export default function Map({route}: any) {
  const locationAddress = route.params;
  const region = {
    latitude: locationAddress.address.latitude,
    longitude: locationAddress.address.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
  const latitude = locationAddress.address.latitude;
  const longitude = locationAddress.address.longitude;

  return (
    <View style={styles.container}>
      <MapView provider={PROVIDER_GOOGLE} region={region} style={styles.map}>
        <Marker coordinate={{latitude, longitude}} />
      </MapView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    height: 400,
    width: '100%',
  },
});
