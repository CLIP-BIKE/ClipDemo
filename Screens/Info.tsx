import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, Text, Touchable, TouchableOpacity, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import {
    Base64,
    BleError,
    BleManager,
    Characteristic,
    Device,
} from 'react-native-ble-plx';
import {encode, decode} from 'base-64';
import { LogBox } from 'react-native';
import { TextInput } from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message


const NUS_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const TX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';

interface request {
  cmd: Base64;
  timeoutID: number;
  resolve?: (result: string) => void;
}

/*interface fetchData{
  makeRequest(cmd: string, device: Device): Promise<string>;
  FWVer: string;
  telemetry: string;
}*/
let activeRequest: request | undefined = undefined;
function Info() {
  const [command, setCommand] = useState<string>('');
  const onChangeText = (command: string) =>{
    setCommand(command)
  }
  /*const [FWVer, setFWVer] = useState<string>('');
  const [telemetry, setTelemetry] = useState<string>('');
  const [triggerPressed, setTriggerPressed] = useState<boolean>(false);
  const [pinPressed, setPinPressed] = useState<boolean>(false);

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
      };*/
    const headerHeight = useHeaderHeight();
    return (
      <View>
        <Text>{command}</Text>
        <View style = {{ flexDirection: 'row', alignItems: 'center', position: 'relative', top: '140%'}}>
          <TextInput placeholder='Enter command' style = {{margin: 12, padding: 10, borderBottomWidth: 2, width: '82%', height: 50}} keyboardType = "ascii-capable" onChangeText={onChangeText} value = {command}></TextInput>
          <TouchableOpacity onPress={() => console.log('command sent')} style={{ position: 'relative', top: '2%' }}>
            <Image source={require('../assets/send.png')} ></Image>
          </TouchableOpacity>
        </View>
      </View>
    );
}

export default Info;