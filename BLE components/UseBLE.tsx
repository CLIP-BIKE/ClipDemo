/* eslint-disable no-bitwise */
import {useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  Base64,
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';
import {PERMISSIONS, requestMultiple} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';

const NUS_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const TX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';

import {encode, decode} from 'base-64';

type VoidCallback = (result: boolean) => void;

interface request {
  cmd: Base64;
  timeoutID: number;
  resolve?: (result: string) => void;
}

let activeRequest: request | undefined = undefined;

interface BluetoothLowEnergyApi {
  requestPermissions(cb: VoidCallback): Promise<void>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  bleManager: BleManager;
  makeRequest(cmd: string, device: Device): Promise<string>;
  connectedDevice: Device | null;
  allDevices: Device[];
  FWVer: string;
  telemetry: string;
  triggerPressed: boolean;
  pinPressed: boolean;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = new BleManager();

  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [FWVer, setFWVer] = useState<string>('');
  const [telemetry, setTelemetry] = useState<string>('');
  const [triggerPressed, setTriggerPressed] = useState<boolean>(false);
  const [pinPressed, setPinPressed] = useState<boolean>(false);

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

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      //if (device && (device.name?.includes('Clip.') || device.name?.includes('Dfu'))) {
      if (device && (device.name?.includes('Clip.'))) {
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

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      startStreamingData(deviceConnection);
      //bleManager.stopDeviceScan();
    } catch (e) {
      console.log('FAILED TO CONNECT', e);
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      //FWVer;
    }
  };

  const makeRequest = (cmd: string, device: Device) => {
    if (activeRequest !== undefined) {
      return Promise.reject("Request already underway!");
    }
    let ret = new Promise<string>((resolve, reject) => {
        console.log('TX: ', cmd);
        return device.writeCharacteristicWithoutResponseForService(
          NUS_UUID,
          TX_CHARACTERISTIC,
          encode(cmd),
        ).then(_ => {
          let id = setTimeout(() => {
            activeRequest = undefined;
            reject("Timeout occurred");
          }, 1000);
          if (activeRequest !== undefined) {
            activeRequest.timeoutID = id;
            activeRequest.resolve = resolve;
          }
        });
    });
    activeRequest = {
      cmd: cmd,
      timeoutID: -1,
    }
    return ret;
  };

  const onRXData = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      console.log("Unable to subscribe", error);
      return -1;
    } else if (!characteristic?.value) {
      console.log('No Data was recieved');
      return -1;
    }
    let data = decode(characteristic?.value);
    console.log('RX: ', data);
    // Check for data that should be parsed immediatel
    if (data.startsWith('~b')) {
      // Button was pressed!
      if (data[2] == '1') {
        setTriggerPressed(true);
      } else if (data[2] == '2') {
        setPinPressed(true);
      } else if (data[2] == '7') {
        setTriggerPressed(false);
      } else if (data[2] == '8') {
        setPinPressed(false);
      }
    } else if (data.startsWith('qV')) {
      setTelemetry(data);
      if ((activeRequest !== undefined)&&(activeRequest.cmd == 'tV')) {
        // If a request is in place for this data, clear it out.
        clearTimeout(activeRequest.timeoutID);
        if (activeRequest.resolve !== undefined) {
          activeRequest.resolve(data);
        }
        activeRequest = undefined;
      }
    } else if (activeRequest !== undefined) {
      // Forward this data to the requestor
      clearTimeout(activeRequest.timeoutID);
      if (activeRequest.resolve !== undefined) {
        activeRequest.resolve(data);
      }
      activeRequest = undefined;
    } else {
      // We got some data that wasn't asked of us:
      console.log('Unhandled RX: ', data);
    }

    // setFWVer('');
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      try {
        device.monitorCharacteristicForService(
          NUS_UUID,
          RX_CHARACTERISTIC,
          (error, characteristic) => onRXData(error, characteristic),
        );
        // Go ahead and retreive the firmware version
        setFWVer(await makeRequest("tv", device));
        // Also trigger telemetry readback
        await makeRequest("tV10", device);
      } catch(e) {
        console.log("Error setting up connection", e);
      }
    } else {
      console.log('No Device Connected');
    }
  };
  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    bleManager,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    makeRequest,
    FWVer,
    telemetry,
    triggerPressed,
    pinPressed,
  };
}

export default useBLE;
