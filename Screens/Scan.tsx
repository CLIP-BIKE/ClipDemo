import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Switch } from 'react-native';
import { LogBox } from 'react-native';
import { TouchableOpacity } from 'react-native';
import CheckForBluetoothPermissions from '../BLE components/CheckForPermissions';
import { RefreshControl } from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const TX_CHARACTERISTIC = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const RX_CHARACTERISTIC = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
const manager = new BleManager();
function Scanner(){
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { requestPermissions } = CheckForBluetoothPermissions();
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    scanForDevices();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    scanForDevices();
    return () => {
      stopScan();
    };
  }, []);

  // This function scans for available clip devices
  const scanForDevices = () => {
    requestPermissions((isGranted) => {
      if (isGranted) {
        setIsScanning(true);
        setDevices([]);
        manager.startDeviceScan(null, null, async (error, device) => {
          if (error) {
            console.log(error);
            return;
          }
          // console.log(device?.localName);
          // console.log(device?.discoverAllServicesAndCharacteristics)
          if (
            device &&
            (device.localName === 'Clip.bike' ||
              device.localName === 'Clip.Main' ||
              device.localName === 'MainDfu' ||
              device.localName === 'Cycling Speed and Cadence')
          ) {
            setDevices((devices) => {
              const existingDeviceIndex = devices.findIndex(
                (d) => d.id === device.id
              );
              if (existingDeviceIndex !== -1) {
                devices[existingDeviceIndex] = device;
                return [...devices];
              } else {
                return [...devices, device];
              }
            });

            setTimeout(() => {
              setIsScanning(false);
              stopScan();
            }, 10000);
          }
        });
      }
    });
  };

  // This function will connect to devices
  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await manager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      manager.stopDeviceScan();
      const status = await device.isConnected();
      if(status){
        console.log(device.id, 'was successfully connected', status);
        /*let services = await device.discoverAllServicesAndCharacteristics().then((results) =>{
          console.log(results)
        });
        console.log(services);*/
      }else{
        console.log(device.id, 'was successfully connected', status);
      }
    } catch (e) {
      console.log('FAILED TO CONNECT', e);
    }
  };

  // This function disconnects from device
  const disconnectFromDevice = async (deviceCo: Device) => {
    const isConnected = await deviceCo.isConnected();
    if (isConnected) {
      manager.cancelDeviceConnection(deviceCo.id);
      setConnectedDevice(null);
      console.log(deviceCo.id, 'disconnected');
    } else {
      console.log(`Device ${deviceCo.id} is not currently connected.`);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    manager.stopDeviceScan();
  };
  const [connectedDeviceS, setConnectedDeviceS] = useState(null);
  const renderItem = ({ item }: { item: Device }) => (
    <View style={{ margin: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>{item?.localName || 'Unknown'}</Text>
      <Text>{item.id}</Text>
      <Switch
        onValueChange={(value) => {
          if (value && item !== connectedDeviceS) {
            if (connectedDeviceS) {
              disconnectFromDevice(connectedDeviceS);
            }
            connectToDevice(item);
            setConnectedDeviceS(item);
          } else if (!value && item === connectedDeviceS) {
            disconnectFromDevice(item);
            setConnectedDeviceS(null);
          }
        }}
        value={item === connectedDeviceS}
      />
    </View>
  );

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
          data={devices}
          keyExtractor={item => item.id}
          renderItem = {renderItem}
          getItemLayout={getItemLayout}
        />
      )}
    </View>
  );
}

export default Scanner;
