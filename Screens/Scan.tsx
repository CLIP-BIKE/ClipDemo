import React, {useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Switch } from 'react-native';
import { LogBox } from 'react-native';
import CheckForBluetoothPermissions from '../BLE components/CheckForPermissions';
import { RefreshControl } from 'react-native';
import {BleManager,Device,} from 'react-native-ble-plx';
import { atob } from 'react-native-quick-base64';
import useBLE from '../BLE components/UseBLE';
LogBox.ignoreLogs(['new NativeEventEmitter()']); // Ignore log notification by message
//const manager = new BleManager();

function Scanner(){
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    disconnectFromDevice,
  } = useBLE();
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    scanForDevices();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    scanForDevices();
    setIsScanning(true)
    return () => {
    };
  }, []);

  const scanForDevices = () => {
    requestPermissions(isGranted => {
      if (isGranted) {
        scanForPeripherals();
      }
    });
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 4000);
  };

  const [connectedDeviceS, setConnectedDeviceS] = useState<Device | null>(null);
  const renderItem = ({ item }: { item: Device }) => (
    <View style={{ margin: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>{item?.localName || 'Unknown'}</Text>
      <Text>{item.id}</Text>
      <Switch
        onValueChange={(value) => {
          if (value && item !== connectedDeviceS) {
            if (connectedDeviceS) {
              disconnectFromDevice();
            }
            connectToDevice(item);
            setConnectedDeviceS(item);
          } else if (!value && item === connectedDeviceS) {
            disconnectFromDevice();
            setConnectedDeviceS(null);
          }
        }}
        value={item === connectedDeviceS}
      />
    </View>
  )
  const getItemLayout = (_: any, index: number) => ({
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
          data={allDevices}
          keyExtractor={item => item.id}
          renderItem = {renderItem}
          getItemLayout={getItemLayout}
        />
      )}
    </View>
  );
}

export default Scanner;
