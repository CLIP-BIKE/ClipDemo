import React, { useContext,useEffect,useState } from 'react';
import {Modal, Button, Keyboard, ScrollView, Text,TouchableOpacity, View, StyleSheet } from 'react-native';
import { LogBox } from 'react-native';
import { TextInput } from 'react-native';
import { DeviceContext } from '../BLE components/DeviceContext';
import deviceInfo from '../BLE components/deviceInfo';
import { ToastAndroid } from 'react-native';
import { decode, encode } from 'base-64';
import { setName } from 'react-native-ble-manager';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
const GENERIC_ACCESS_SERVICE_UUID = '00001800-0000-1000-8000-00805f9b34fb';
const DEVICE_NAME_CHARACTERISTIC = '00002A00-0000-1000-8000-00805F9B34FB';
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
  newString.split(", ").forEach((item) => {
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
  const [renametext, setRenameText] = useState<string>('');
  const [renameisVisible, setRenameVisible] = useState<boolean>(false);

  useEffect(() =>{
   getMainFirmware(); 
  },[]);
  useEffect(() => {
    try {
      const mainObject = MainPCBA(telemetry);
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
  }, [telemetry])
  
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
  const remoteHandleButtonPress = async () => {
    if(state.connectedDevice){
      setIsRemoteVisible(true);
      try {
          await makeRequest('xv', state.connectedDevice!).then((version) =>{
              if(version.includes('qv')){
                version = version.replace('qv', '');
              }
              setRemoteFirmwareVersion(version);
            })
      } catch (error) {
        console.log(error);
      }
    }else{
      ToastAndroid.showWithGravity('Please connect a device', ToastAndroid.SHORT, ToastAndroid.CENTER);
    }
  }

  const remoteHandleCloseModal = async () => {
    setIsRemoteVisible(false);
  }

  const getMainFirmware = async () =>{
    try {
          if(state.connectedDevice){
            await makeRequest('tv', state.connectedDevice!).then((version) =>{
              if(version.includes('qv')){
                version = version.replace('qv', '');
              }
              setMainFirmwareVersion(version);
            })
          }
    }catch (error) {
      console.log(error);
    }
  }
  const changeDeviceName = async () =>{
    if(state.connectedDevice){
      try {
        await state.connectedDevice.writeCharacteristicWithoutResponseForService(
          GENERIC_ACCESS_SERVICE_UUID,
          DEVICE_NAME_CHARACTERISTIC,
          encode(renametext)
        );
        setRenameText('');
        setRenameVisible(false);
      } catch (error) {
        console.log('error: ', error)
      }
    }
  }
  const renameHandle = () =>{
    if(state.connectedDevice){
      setRenameVisible(true);
    }else{
      ToastAndroid.showWithGravity('Please connect a device', ToastAndroid.SHORT, ToastAndroid.CENTER);
    }
  }
  const renameHandleCloseModal = () =>{
    setRenameVisible(false);
    setRenameText('');
  }

  const getDeviceName = async () =>{
    if(state.connectedDevice){
      try {
        await state.connectedDevice.readCharacteristicForService(GENERIC_ACCESS_SERVICE_UUID,DEVICE_NAME_CHARACTERISTIC).then((name) => {
          console.log('The new name is ', decode(name.value!));
        })
        //setRenameVisible(false);
      } catch (error) {
        console.log('error: ', error)
      }
    }
  }
  getDeviceName();
  console.log(state.connectedDevice?.name, 'in Info');
  
  return (
    <View style = {{ backgroundColor: 'grey', height: '100%', flex: 1, padding: 5, margin: 5}}>
      <View style = {{width: '100%', position: 'relative'}}>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, marginBottom: 5, padding: 5, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} onPress={mainHandleButtonPress}><Text style = {renameModalStyles.buttonText}>Main</Text></TouchableOpacity>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, marginBottom: 5, padding: 5, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} onPress={remoteHandleButtonPress}><Text style = {renameModalStyles.buttonText}>Remote</Text></TouchableOpacity>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, marginBottom: 5, padding: 5, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}}><Text style = {renameModalStyles.buttonText}>Update Main</Text></TouchableOpacity>
        <TouchableOpacity style={{backgroundColor: '#5abf90', height: 30, marginBottom: 5, padding: 5, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} onPress = {renameHandle}><Text style = {renameModalStyles.buttonText}>Rename Device</Text></TouchableOpacity>
      </View>
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
              <Text style ={styles.dataText}>Firmware Version: {remoteFirmwareVersion}</Text>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible = {renameisVisible} animationType = 'slide' transparent = {true}>
        <View style={renameModalStyles.modal}>
          <Text style={renameModalStyles.heading}>Rename Device</Text>
          <TextInput style={renameModalStyles.input} value={renametext} onChangeText={setRenameText} placeholder="Enter new name"/>
          <View style={renameModalStyles.buttons}>
            <TouchableOpacity onPress={renameHandleCloseModal} style={renameModalStyles.cancelButton}><Text style={renameModalStyles.buttonText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={changeDeviceName} style={renameModalStyles.renameButton}><Text style={renameModalStyles.buttonText}>Rename</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const renameModalStyles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ddd',
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  renameButton: {
    flex: 1,
    backgroundColor: '#5abf90',
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
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