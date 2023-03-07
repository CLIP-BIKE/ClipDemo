import {useState} from 'react';
import {PermissionsAndroid, Platform, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Base64,BleError,BleManager,Characteristic,Device,} from 'react-native-ble-plx';
import {PERMISSIONS, requestMultiple} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import {encode, decode} from 'base-64';

//instance of bleManager is declare. It's global to prevent it from rerendering hence change the device.
const bleManager = new BleManager();

type VoidCallback = (result: boolean) => void;

//interface to define what the useBLE component can do
interface BluetoothLowEnergyApi {
  requestPermissions(cb: VoidCallback): Promise<void>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  connectedDevice: Device | null;
  disconnectFromDevice: () => void;
  allDevices: Device[];
  setConnectedDevice(device: Device): void;
}

function useBLE(): BluetoothLowEnergyApi {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const requestPermissions = async (cb: VoidCallback) => {
    if (Platform.OS === 'android') {
      const apiLevel = await DeviceInfo.getApiLevel();

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth Low Energy requires Location',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        cb(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ]);

        const isGranted =
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;

        cb(isGranted);
      }
    } else {
      cb(true);
    }
  };
  //This function expression checks if a device in the array of devices is duplicate.
  const isDuplicteDevice = (devices: Device[], nextDevice: Device) => devices.findIndex(device => nextDevice.id === device.id) > -1;
  
  //This function expression initialize the scan of the bleManager instance, and search for devices which correspond to Clip.bike 
  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device && (device.name?.includes('Clip.') || device.name?.includes('Dfu'))) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          setTimeout(() => {
            bleManager.stopDeviceScan();
          }, 1000);
          return prevState;
        });
      }
  });
  
  //This function expression connect to a device by accepting, the specific devie as an argument
  const connectToDevice = async (device: Device) => {
    try {
      //setConnectedDevice(device);
      const deviceConnection = await bleManager.connectToDevice(device.id);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      //startStreamingData(deviceConnection);
    } catch (e) {
      console.log('FAILED TO CONNECT', e);
    }
  };
  
  // Since connecting to multiple device won't be allowed. This fucntion do not accept any argument and just cancel form the connected device
  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      console.log(connectedDevice.id, 'disconnected');
    }
  };


  console.log(connectedDevice?.id, 'Connected in useBLE');
  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    connectedDevice,
    allDevices,
    disconnectFromDevice,
    setConnectedDevice
  };
}

export default useBLE;
