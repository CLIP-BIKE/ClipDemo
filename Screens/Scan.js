import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { LogBox } from 'react-native';
import { TouchableOpacity } from 'react-native';
import CheckForBluetoothPermissions from '../BLE components/CheckForPermissions';
import { RefreshControl } from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

function Scanner() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { requestPermissions } = CheckForBluetoothPermissions();

  const manager = new BleManager();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    scanForDevices();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    scanForDevices();

    return () => {
      stopScan();
    };
  }, []);

  const scanForDevices = () => {
    requestPermissions(isGranted => {
      if (isGranted) {
        setIsScanning(true);
        setDevices([]);
        manager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.log(error);
            return;
          }
          console.log(device.localName);
          if (device.localName === 'Clip.bike' || device.localName === 'Clip.Main' || device.localName === 'MainDfu' || device.localName === 'Blank bbbhugffytyygctffyf') {
            setDevices(devices => {
              const existingDeviceIndex = devices.findIndex(d => d.id === device.id);
              if (existingDeviceIndex !== -1) {
                devices[existingDeviceIndex] = device;
                return [...devices];
              } else {
                return [...devices, device];
              }
            });

            setTimeout(() => {
              setIsScanning(false)
              stopScan();
            }, 5000);

          }
        });
      } else {
        <Text>PLease Allow bluetooth</Text>
      }
    });
  };

  const stopScan = () => {
    setIsScanning(false);
    manager.stopDeviceScan();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={{ margin: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>{item?.localName || 'Unknown'}</Text>
      <Text>{item.id}</Text>
    </TouchableOpacity>
  );

  const getItemLayout = (data, index) => ({
    length: 60,
    offset: 60 * index,
    index,
  });

  return (
    <View style={{ flex: 1, padding: '2%' }}>
      {isScanning && (
        <View style={{ alignItems: 'center', margin: '5%' }}>
          <ActivityIndicator size="large" color="#5abf90" />
          <Text style={{ marginTop: '2%', fontSize: 16 }}>Scanning for devices...</Text>
        </View>
      )}

      {!isScanning && (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}></RefreshControl>}
          data={devices}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
        />
      )}
    </View>
  );
}

export default Scanner;
