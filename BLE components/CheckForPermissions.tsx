import React from 'react';
import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import {PERMISSIONS, requestMultiple} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';

type PermissionsCallback = (result: boolean) => void;
interface BleApi {
  requestPermissions(callback: PermissionsCallback): Promise<void>;
}
function CheckForBluetoothPermissions():BleApi {
    const requestPermissions = async (callback: PermissionsCallback) => {
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
            callback(granted === PermissionsAndroid.RESULTS.GRANTED);
          } else {
            const result = await requestMultiple([
              PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
              PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
              PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
            ]);
    
            const isGranted =
              result['android.permission.BLUETOOTH_CONNECT'] ===
                PermissionsAndroid.RESULTS.GRANTED &&
              result['android.permission.BLUETOOTH_SCAN'] ===
                PermissionsAndroid.RESULTS.GRANTED &&
              result['android.permission.ACCESS_FINE_LOCATION'] ===
                PermissionsAndroid.RESULTS.GRANTED;
    
            callback(isGranted);
          }
        } else {
          callback(true);
        }
      };
  return{
    requestPermissions
  }
   
}
export default CheckForBluetoothPermissions;