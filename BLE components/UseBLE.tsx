/*import {PERMISSIONS, requestMultiple} from 'react-native-permissions';
import { BleManager, Characteristic, Service, Device } from 'react-native-ble-plx';
import { NativeEventEmitter, NativeModules } from 'react-native';*/
import { useState } from 'react';
import React, {useEffect } from 'react';
import { View, Text } from 'react-native';
import { BleManager, Characteristic, Device, Service } from 'react-native-ble-plx';
/*const bleManager = new BleManager();
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
function useBLE(){
  const [devices, setDevices] = useState([]);
  bleManager.startDeviceScan([], { allowDuplicates: false }, (error, device) => {
    if (error) {
      console.log('Error scanning for devices', error);
      return;
    }
    if(device?.localName!= null){
      console.log('Found device', device?.localName, device?.id);
    }
    setTimeout(() => {
      bleManager.stopDeviceScan();
    }, 10000);
  });
}*/

