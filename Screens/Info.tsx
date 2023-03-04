import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import {ScrollView, Text,TouchableOpacity, View } from 'react-native';
import { LogBox } from 'react-native';
import { TextInput } from 'react-native';
import { DeviceContext } from '../BLE components/DeviceContext';
import useBLE from '../BLE components/useBLE';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

function Info() {
  const { state, dispatch } = useContext(DeviceContext);
    return (
      <View style = {{ backgroundColor: 'grey', height: '100%', flex: 1, padding: 5}}>
        <ScrollView style = {{height: '85%', backgroundColor: 'white'}}>
          {state.connectedDevice? <Text>{state.connectedDevice?.id} is connected</Text>:<Text>Please Connect to a device</Text>}
        </ScrollView>
        <View style = {{ backgroundColor: 'white', padding: 5, flexDirection: 'row', alignItems: 'center', position: 'relative', top:'1%'}}>
          <TextInput style ={{borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: '80%'}} placeholder='Enter Command'></TextInput>
          <TouchableOpacity style={{backgroundColor: '#007AFF', padding: 10, borderRadius: 5, marginLeft: 10}}>
          < Text style={{ color: 'blue', fontSize: 16}}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}

export default Info;