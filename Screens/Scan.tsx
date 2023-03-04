import React, {useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Switch } from 'react-native';
import { LogBox } from 'react-native';
import { RefreshControl } from 'react-native';
import {Device,} from 'react-native-ble-plx';
import useBLE from '../BLE components/useBLE';
import { useContext } from 'react';
import { DeviceContext } from '../BLE components/DeviceContext';

LogBox.ignoreLogs(['new NativeEventEmitter()']); // Ignore log notification by message
function Scanner (){
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    disconnectFromDevice,
    connectedDevice
  } = useBLE();
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { state, dispatch } = useContext(DeviceContext);

  const setDevice = (device: Device) => {
    dispatch({ type: 'SET_DEVICE', device });
  };

  const clearDevice = () => {
    dispatch({ type: 'CLEAR_DEVICE' });
  };

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
  const renderItem = ({ item }: { item: Device }) => (
    <View style={{ margin: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>{item?.localName || 'Unknown'}</Text>
      <Text>{item.id}</Text>
      <Switch
        onValueChange={(value) => {
          if (value) {
            setDevice(item);
            connectToDevice(item);
          } else{
            disconnectFromDevice();
            clearDevice();
          }
        }}
        value={connectedDevice != null}
      />
    </View>
  )
  const getItemLayout = (_: any, index: number) => ({
    length: 60,
    offset: 60 * index,
    index,
  });
  console.log(connectedDevice?.id, 'scanner');
  
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
