import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import {Alert, ScrollView, Text,TouchableOpacity, View } from 'react-native';
import { LogBox } from 'react-native';
import { TextInput } from 'react-native';
import { DeviceContext } from '../BLE components/DeviceContext';
import deviceInfo from '../BLE components/deviceInfo';
import { ToastAndroid } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

const NUS_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const TX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
function Info() {
  const {FWVer, telemetry, startStreamingData, makeRequest} = deviceInfo();
  const { state, dispatch } = useContext(DeviceContext);
  const [command, setCommand] = useState<string>('');
  const sendRequest = async (cmd: string) => {
    try {
      if (state.connectedDevice && command !=  undefined) {
        await makeRequest(cmd, state.connectedDevice);
      }
    } catch (error) {
      console.log(error)
    }
  };
  const commandValid = (commands: string | undefined) =>{
    if(commands?.includes('tv') || commands?.includes('T')){
      return true
    }
    return false;
  }
  const handlePress = () => {
    if(state.connectedDevice){
      if(command != undefined && commandValid(command)){
        sendRequest(command);
        setCommand('');
        console.log('command was sent');
      }else{
        ToastAndroid.showWithGravity('Invalid command was entered', ToastAndroid.SHORT, ToastAndroid.CENTER);
        setCommand('');
      }
    }else if(state.connectedDevice === null){
      ToastAndroid.showWithGravity('Please connect a device', ToastAndroid.SHORT, ToastAndroid.CENTER);
      setCommand('');
    }
  };
  console.log(state.connectedDevice?.localName, 'in Info');
  return (
    <View style = {{ backgroundColor: 'grey', height: '100%', flex: 1, padding: 5}}>
      <ScrollView style = {{height: '85%', backgroundColor: 'white', padding: 5}}>
        {state.connectedDevice? <Text>{state.connectedDevice?.id} is connected</Text>:<Text>Please Connect to a device</Text>}
        {state.connectedDevice && FWVer?<Text>{FWVer}</Text>: <Text style ={{display:'none'}}></Text>}
        {state.connectedDevice && telemetry?<Text>{telemetry}</Text>: <Text style ={{display:'none'}}></Text>}
      </ScrollView>
      <View style = {{ backgroundColor: 'white', padding: 5, flexDirection: 'row', alignItems: 'center', position: 'relative', top:'1%'}}>
        <TextInput style ={{borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: '80%'}} placeholder='Enter Command' value = {command} onChangeText={setCommand}></TextInput>
        <TouchableOpacity style={{backgroundColor: '#007AFF', padding: 10, borderRadius: 5, marginLeft: 10}} onPress = {handlePress}>
        < Text style={{ color: 'blue', fontSize: 16}}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Info;