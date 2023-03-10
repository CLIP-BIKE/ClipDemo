import * as React from 'react';
import { View, Text,Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Scan from './Scan';
import Info from './Info';

const Tab = createBottomTabNavigator();
function MyTabs() {
  return (
      <Tab.Navigator screenOptions = {{tabBarShowLabel: false, tabBarStyle: {height: 50, margin: 1}}}>
      <Tab.Screen name = "Scanner" component = {Scan}  options = {{
        tabBarIcon: ({focused}) =>(
          <View style = {{alignItems:'center'}}>
            <Image source={require('../assets/bluetoothSearch.png')} resizeMode = "contain" style = {{width: 30, height: 25, tintColor: focused? '#5abf90' : '#748c94'}}></Image>
            <Text style = {{color: focused? '#5abf90' : '#748c94'}}> Scanner</Text>
          </View>
        ),
      }}></Tab.Screen>
      <Tab.Screen name = "Device info" component={Info} options = {{
        tabBarIcon: ({focused}) =>(
            <View style = {{alignItems:'center'}}>
              <Image source={require('../assets/info.png')} resizeMode = "contain" style = {{width: 30, height: 25, tintColor: focused? '#5abf90' : '#748c94'}}></Image>
              <Text style = {{color: focused? '#5abf90' : '#748c94'}}>Device info!</Text>
            </View>
        ),
      }}></Tab.Screen>
    </Tab.Navigator>
    
  );
}
function Main() {
  return (
    <NavigationContainer>
      <MyTabs/>
    </NavigationContainer>
  );
}

export default Main;