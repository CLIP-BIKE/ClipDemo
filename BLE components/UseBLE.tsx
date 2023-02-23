/*import {PERMISSIONS, requestMultiple} from 'react-native-permissions';
import { BleManager, Characteristic, Service, Device } from 'react-native-ble-plx';
import { NativeEventEmitter, NativeModules } from 'react-native';*/
import { useState } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { atob, btoa } from 'react-native-quick-base64';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const asciiString = 'tv';
const base64String = btoa(asciiString);
const manager = new BleManager();
function UseBLE(){
// Connect to the nRF microcontroller
const deviceId = 'FC:D2:0E:72:80:60';
const [device, setDevice] = useState<Device>();
manager.startDeviceScan(null, null, async (error, device) => {
  if (error) {
    console.log('Error scanning for devices', error);
    return;
  }

  if (device?.name === 'Clip.bike') {
    console.log('Found device:', device.id);
    manager.stopDeviceScan();
    manager.connectToDevice(device.id)
      .then(async (device) => {
        console.log('Connected to device:', device.name);
        // Discover the UART service and characteristics
        await device.discoverAllServicesAndCharacteristics();
        device.monitorCharacteristicForService(UART_SERVICE_UUID, UART_RX_CHARACTERISTIC_UUID, async (error,characteristic) => {
          if(error){
            console.log(JSON.stringify(error))
          }
          await device.writeCharacteristicWithResponseForService(UART_SERVICE_UUID, UART_TX_CHARACTERISTIC_UUID, base64String);
          var data = atob(characteristic?.value!);
          console.log(data)
        });
      })
  }
});

}
export default UseBLE;