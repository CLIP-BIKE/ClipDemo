import React, { useContext,useEffect,useState } from 'react';
import {Modal, Button, Keyboard, ScrollView, Text,TouchableOpacity, View, StyleSheet } from 'react-native';
import { LogBox } from 'react-native';
import { TextInput } from 'react-native';
import { DeviceContext } from '../BLE components/DeviceContext';
import deviceInfo from '../BLE components/deviceInfo';
import { ToastAndroid } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

interface data {
  RPM: number;
  I: number;
  Vbatt: number;
  Charge: number;
  Temps: number[];
  Drive: number;
  [key: string]: any;
}
function removeQVesc(inputString: string) {
  return inputString.replace('qVesc: ', '');
}
function MainPCBA(str: string): data {
  const newString = removeQVesc(str);
  const result: Partial<data> = {};
  console.log(str);
  newString.split(", ").forEach((item) => {
    console.log(item)
    const [key, value] = item.split(" ");
    //console.log([key, value])
    if (key === "Temps") {
      result[key] = value.split("/").map(Number);
    } else {
      result[key] = Number(value);
    }
  });

  return result as data;
}
const batteryPercent = (voltage: number) => {
  const maximumVoltage: number = 40925;
  var batteryLevel = (voltage/maximumVoltage) * 100;
  return Math.floor(batteryLevel);
}
const isCharging = (chargeStatus: number): string => {
  if(chargeStatus === 0){
    return 'Not charging'
  }
  return 'charging..';
}

function Info() {
  const {FWVer, telemetry, startStreamingData, makeRequest} = deviceInfo();
  const { state, dispatch } = useContext(DeviceContext);
  const [command, setCommand] = useState<string>('');
  const [battery, setBattery] = useState<number>(0);
  const [rpm, setrpm] = useState<number>(0);
  const [chargeStatus, setchargeStatus] = useState<string>('');
  const [temp, setTemp] = useState<number[]>([]);
  const [runtimeCurrent, setRuntimeCurrent] = useState<number>(0);
  const [runtimeVoltage, setRuntimeVoltage] = useState<number>(0);
  const [drive, setDrive] = useState<number>(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isMainVisible, setIsMainVisible] = useState(false);
  const [isRemoteVisible, setIsRemoteVisible] = useState(false);
  const [mainFirmwareVersion, setMainFirmwareVersion] = useState<string>('');
  const [remoteFirmwareVersion, setRemoteFirmwareVersion] = useState<string>('');
  useEffect(() => {
    try {
      getMainFirmwareVersion()
    } catch (error) {
      console.log(error);
    }
  }, [])
  useEffect(() => {
    try {
      const mainObject = MainPCBA(telemetry);
      console.log('The battery is',mainObject.RPM);
      setBattery(batteryPercent(mainObject.Vbatt));
      setrpm(mainObject.RPM);
      setDrive(mainObject.Drive);
      setchargeStatus(isCharging(mainObject.Charge));
      setTemp(mainObject.Temps);
      setRuntimeCurrent(mainObject.I);
      setRuntimeVoltage(mainObject.Vbatt);
    } catch (error) {
      console.log(error);
    }
  }, [telemetry]);
  const sendRequest = async (cmd: string) => {
    try {
      if (state.connectedDevice && command !=  undefined) {
        startStreamingData(state.connectedDevice, command);
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
  //handle press for keyboard
  const handlePress = () => {
    setIsFocused(true);
    Keyboard.dismiss();
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
  const handleFocus = () => {
    setIsFocused(true);
  };
  const handleBlur = () => {
    setIsFocused(false);
  };
  //handle press for modal
  const mainHandleButtonPress = () => {
    if(state.connectedDevice){
      setIsMainVisible(true);
      try {
          const data = async () => {
              if(state.connectedDevice){
                await makeRequest('TV10', state.connectedDevice!);
                const mainObject = MainPCBA(telemetry);
                console.log('the battery is',mainObject.Vbatt);
              }
          }
          data()
      } catch (error) {
        console.log(error);
      }
    }else{
      ToastAndroid.showWithGravity('Please connect a device', ToastAndroid.SHORT, ToastAndroid.CENTER);
    }
  }

  const mainHandleCloseModal = async () => {
    setIsMainVisible(false);
    try {
      if(state.connectedDevice){
        await makeRequest('TV0', state.connectedDevice!);
      }
    } catch (error) {
      console.log(error)
    }
  }
  const remoteHandleButtonPress = () => {
    if(state.connectedDevice){
      setIsRemoteVisible(true);
    }else{
      ToastAndroid.showWithGravity('Please connect a device', ToastAndroid.SHORT, ToastAndroid.CENTER);
    }
  }

  const remoteHandleCloseModal = async () => {
    try {
       setIsRemoteVisible(false);
    } catch (error) {
      console.log(error)
    }
    setIsRemoteVisible(false);
  }

  const getMainFirmwareVersion = async () => {
    try {
      await makeRequest('tv', state.connectedDevice!).then((version) =>{
        if(version.includes('qv')){
          version = version.replace('qv', '');
        }
        setMainFirmwareVersion(version);
      });
    }catch (error) {
    console.log(error);
    }
  }
  console.log(state.connectedDevice?.localName, 'in Info');
  
  return (
    <View style = {{ backgroundColor: 'grey', height: '100%', flex: 1, padding: 5, margin: 5}}>
      <View style = {{flexDirection: 'row', width: '100%', position: 'relative', paddingEnd: '3%'}}>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, width: '20%', marginBottom: 5, padding: 5, borderRadius: 5, marginRight: 5, justifyContent: 'center', alignItems: 'center'}} onPress={mainHandleButtonPress}><Text>Main</Text></TouchableOpacity>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, width: '20%', marginBottom: 5, padding: 5, borderRadius: 5, marginRight: 5, justifyContent: 'center', alignItems: 'center'}} onPress={remoteHandleButtonPress}><Text>Remote</Text></TouchableOpacity>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, marginBottom: 5, padding: 5, borderRadius: 5, marginRight: 5, justifyContent: 'center', alignItems: 'center'}}><Text>Update Main</Text></TouchableOpacity>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, marginBottom: 5, padding: 5, borderRadius: 5, marginRight: 5, justifyContent: 'center', alignItems: 'center'}}><Text>update Remote</Text></TouchableOpacity>
      </View>
      <ScrollView style = {{height: '85%', backgroundColor: 'white', padding: 5, zIndex:0}}>
        {state.connectedDevice? <Text>{state.connectedDevice?.id} is connected</Text>:<Text>Please Connect to a device</Text>}
        {state.connectedDevice && FWVer?<Text>{FWVer}</Text>: <Text style ={{display:'none'}}></Text>}
        {state.connectedDevice && telemetry?<Text>{telemetry}</Text>: <Text style ={{display:'none'}}></Text>}
      </ScrollView>
      <Modal visible={isMainVisible} animationType="slide" transparent={true}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Main PCBA Data</Text>
          </View>
          <View style={styles.content}>
            <TouchableOpacity style={styles.closeButton} onPress={mainHandleCloseModal}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity>
            <View style ={styles.dataContainer}>
            <Text style ={styles.dataText}>Firmware Version: {mainFirmwareVersion}</Text>
              <Text style ={styles.dataText}>Batterylevel level: {battery} %</Text>
              <Text style ={styles.dataText}>RPM: {rpm}</Text>
              <Text style ={styles.dataText}>ChargeStatus: {chargeStatus}</Text>
              {temp != undefined? <Text style ={styles.dataText}>Motor Temperature: {temp[0]}° C</Text>: <Text style ={styles.dataText}>Motor Temperature: 0° C</Text>}
              {temp != undefined? <Text style ={styles.dataText}>PCB Temperature: {temp[1]}° C</Text>: <Text style ={styles.dataText}>Motor Temperature: 0° C</Text>}
              {temp != undefined? <Text style ={styles.dataText}>Air Temperature: {temp[2]}° C</Text>: <Text style ={styles.dataText}>Motor Temperature: 0° C</Text>}
              <Text style ={styles.dataText}>Drive: {drive}</Text>
              <Text style ={styles.dataText}>Runtime Current: {runtimeCurrent} mA</Text>
              <Text style ={styles.dataText}>Runtime Voltage: {runtimeVoltage} mV</Text>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={isRemoteVisible} animationType="slide" transparent={true}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Remote PCBA Data</Text>
          </View>
          <View style={styles.content}>
            <TouchableOpacity style={styles.closeButton} onPress={remoteHandleCloseModal}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity>
            <View style ={styles.dataContainer}>
              <Text style ={styles.dataText}>Batterylevel level: {battery} %</Text>
            </View>
          </View>
        </View>
      </Modal>
      <View style = {{ backgroundColor: 'white', padding: 5, flexDirection: 'row', alignItems: 'center', position: 'relative', top:'1%'}}>
        <TextInput onFocus={handleFocus} onBlur={handleBlur} autoFocus={isFocused} style ={{borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: '80%'}} placeholder='Enter Command' value = {command} onChangeText={setCommand}></TextInput>
        <TouchableOpacity style={{backgroundColor: '#5abf90', padding: 10, borderRadius: 5, marginLeft: 10}} onPress = {handlePress}>
        < Text style={{ color: 'blue', fontSize: 16}}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dataButton: { 
    fontFamily: 'Arial', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  modal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'grey'
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'black'
  },
  content: {
    height: '90%',
    width: '97%',
    backgroundColor: 'white',
    alignItems: 'center',
    top: '4%',
  },
  closeButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dataContainer: {
    backgroundColor: 'grey',
    width: '90%',
    margin: 10,
    height: '80%',
    padding: 10,
  },
  dataText: {
    fontSize: 20
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
export default Info;