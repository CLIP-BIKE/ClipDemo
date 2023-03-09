import React, {useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Switch } from 'react-native';
import { LogBox } from 'react-native';
import { RefreshControl } from 'react-native';
import {BleManager, Device,} from 'react-native-ble-plx';
import useBLE from '../BLE components/UseBLE';
import { useContext } from 'react';
import { DeviceContext } from '../BLE components/DeviceContext';
import { decode } from 'base-64';
const GENERIC_ACCESS_SERVICE_UUID = '00001800-0000-1000-8000-00805f9b34fb';
const DEVICE_NAME_CHARACTERISTIC = '00002A00-0000-1000-8000-00805F9B34FB';
LogBox.ignoreLogs(['new NativeEventEmitter()']); // Ignore log notification by message
function Scanner (){
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    disconnectFromDevice,
    connectedDevice,
    setConnectedDevice
  } = useBLE();
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { state, dispatch } = useContext(DeviceContext);
  const [customName, setCustomName] = useState<string>('default');
  

  const setDeviceContext = (device: Device) => {
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
    }, 5000);
  };

  const getDeviceName = async (device: Device)=> {
    try {
        await device.readCharacteristicForService(GENERIC_ACCESS_SERVICE_UUID, DEVICE_NAME_CHARACTERISTIC).then((response) =>{
          const name = decode(response.value!);
          setCustomName(name);
        });
    } catch (error) {
      console.log('error: ', error);
      return '';
    }
  }
  if(state.connectedDevice){
    getDeviceName(state.connectedDevice);
  }
  useEffect(() => {
    if(state.connectedDevice){
      getDeviceName(state.connectedDevice);
    }
  }, [customName]);
  const renderItem = ({ item }: { item: Device }) => (
    <View style={{ margin: 10, flex: 1, justifyContent: 'center', borderWidth: 1 ,borderColor: 'grey', borderRadius: 10}}>
      <View style={{ flexDirection: 'column', top:'10%', padding: 5}}>
        <Text style={{ fontWeight: 'bold' }}>{customName || 'Unknown'}</Text>
        <Text>{item.id}</Text>
      </View>
      <Switch
        onValueChange={(value) => {
          if (value) {
            setDeviceContext(item);
            setConnectedDevice(item)
            connectToDevice(item);
          } else{
            disconnectFromDevice();
            clearDevice();
          }
        }}
        value={item === connectedDevice &&connectedDevice != null}
        style={{ justifyContent: 'flex-end', bottom:'30%'}}
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
