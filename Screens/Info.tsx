import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, Touchable, TouchableOpacity, View } from 'react-native';
import { LogBox } from 'react-native';
import { TextInput } from 'react-native';
import useBLE from '../BLE components/UseBLE';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

function Info() {
  const {
    telemetry,
    FWVer
  } = useBLE();
  const [command, setCommand] = useState<string>('');
  const onChangeText = (command: string) =>{
    setCommand(command)
  }
    return (
      <View style = {{ backgroundColor: 'grey', height: '100%', flex: 1, padding: 5}}>
        <ScrollView style = {{height: '85%', backgroundColor: 'white'}}>
        </ScrollView>
        <View style = {{ backgroundColor: 'white', padding: 5, flexDirection: 'row', alignItems: 'center', position: 'relative', top:'1%'}}>
          <TextInput style ={{borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: '80%'}} placeholder='Enter Command' value={command} onChangeText = {setCommand}></TextInput>
          <TouchableOpacity style={{backgroundColor: '#007AFF', padding: 10, borderRadius: 5, marginLeft: 10}}>
          < Text style={{ color: 'blue', fontSize: 16}}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}

export default Info;