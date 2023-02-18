/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import Main from './Screens/Main';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import { useColorScheme, View } from 'react-native';
import CheckForBluetoothPermissions from './BLE components/CheckForPermissions';
import UseBLE from './BLE components/UseBLE';
function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  //CheckForBluetoothPermissions();
  //UseBLE();
  return (
      <Main></Main>

  );
}


export default App;
