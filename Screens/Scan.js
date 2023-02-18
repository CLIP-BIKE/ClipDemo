import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { LogBox } from 'react-native';
import { TouchableOpacity } from 'react-native';
import CheckForBluetoothPermissions from '../BLE components/CheckForPermissions';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

function Scan() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const {requestPermissions} = CheckForBluetoothPermissions();

  const manager = new BleManager();

  useEffect(() => {
    scanForDevices();
    //Stop scan after 5 seconds
    setTimeout(() => {
      stopScan();
    }, 10000);

    return () => {
      stopScan();
    };
  }, []);

  const scanForDevices = () => {
    requestPermissions(isGranted => {
      if(isGranted){
        setIsScanning(true);
        setDevices([]);
        manager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.log(error);
            return;
          }
          console.log(device.localName);
          if(device.localName === 'Clip.bike' || device.localName === 'Clip.Main' || device.localName === 'MainDfu' || device.localName === 'Blank bbbhugffytyygctffyf'){
            setDevices(devices => {
              const existingDeviceIndex = devices.findIndex(d => d.id === device.id);
                if (existingDeviceIndex !== -1) {
                  devices[existingDeviceIndex] = device;
                  return [...devices];
                } else {
                  return [...devices, device];
                }
            });
          }
        });
      }else{
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
          data={devices}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
        />
      )}
    </View>
  );
}

export default Scan;
