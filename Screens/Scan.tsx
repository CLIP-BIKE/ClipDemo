import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Switch } from 'react-native';
import { LogBox } from 'react-native';
import { TouchableOpacity } from 'react-native';
import CheckForBluetoothPermissions from '../BLE components/CheckForPermissions';
import { RefreshControl } from 'react-native';
import {BleError,BleManager,Characteristic,Device,} from 'react-native-ble-plx';
import base64 from 'react-native-base64'
import { atob } from 'react-native-quick-base64';
import { Buffer } from 'buffer';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
const manager = new BleManager();
function convertBase64(str: string){
  //convert string to  ASCII
  const bytes = Uint8Array.from(atob(str), c => c.charCodeAt(0));
  //converts ASCCII to decimal
  const dataView = new DataView(bytes.buffer);
  const value = dataView.getUint8(0);
  return value;
}
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
      console.log('About to check for services')
      const status = await device.isConnected();
      console.log('The status is', status);
      if(status){
        connectedDevice?.connect();
        console.log(device.id, 'was successfully connected', status);
        //get all the services and characteristics
        await device.discoverAllServicesAndCharacteristics();
          const services = await device.services();
          for (let service of services) {
            console.log(`Service UUID: ${service.uuid}`);
            const characteristics = await service.characteristics();
            for (let characteristic of characteristics) {
              //console.log(characteristic)
              console.log(`Characteristic UUID: ${characteristic.uuid}`);
              
              if(service.uuid === '00001800-0000-1000-8000-00805f9b34fb' && characteristic.uuid === '00002a00-0000-1000-8000-00805f9b34fb'){
                try{
                  device.monitorCharacteristicForService('00001800-0000-1000-8000-00805f9b34fb', '00002a00-0000-1000-8000-00805f9b34fb', async (error,characteristic) => {
                    if(error){
                      console.log(JSON.stringify(error))
                    }
                    await device.readCharacteristicForService('00001800-0000-1000-8000-00805f9b34fb', '00002a00-0000-1000-8000-00805f9b34fb');
                    const str = characteristic?.value;
                    //convert string to  ASCII
                    const bytes = Uint8Array.from(atob(str!), c => c.charCodeAt(0));
                    //converts ASCCII to decimal
                    const dataView = new DataView(bytes.buffer);
                    const value = dataView.getUint8(0);
                    console.log(`The battery is: ${value}%`);
                  });
                }catch(error){
                  console.log(error)
                }
                
              }
            }
          }
          /*try{
              const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
              const TX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
              const RX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
              //const tx = device.readCharacteristicForService('00001800-0000-1000-8000-00805f9b34fb', '00002a00-0000-1000-8000-00805f9b34fb')
              const BATTERY_LEVEL_COMMAND = 'battery';
            device.monitorCharacteristicForService('00001800-0000-1000-8000-00805f9b34fb', '00002a00-0000-1000-8000-00805f9b34fb', (error,characteristic) => {
              if(error){
                console.log(JSON.stringify(error))
              }
              
              const str = characteristic?.value;
              console.log(str)
              try{
                //convert string to  ASCII
              const bytes = Uint8Array.from(atob(str!), c => c.charCodeAt(0));
              //converts ASCCII to decimal
              const dataView = new DataView(bytes.buffer);
              const value = dataView.getUint8(0);
              console.log(`The battery is: ${value}%`);
              }catch(error){
                console.log(error)
              }
              
            });
            /*const data = Buffer.from(BATTERY_LEVEL_COMMAND);
            (await tx).writeWithResponse(data)
            
          }catch(error){
            console.log(error)
          }*/
      }else{
        console.log(device.id, 'was not connected but error did not show', status);
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
  const [connectedDeviceS, setConnectedDeviceS] = useState<Device |null>(null);
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
