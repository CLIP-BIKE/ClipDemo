import React, { createContext, useReducer } from 'react';
import { Device } from 'react-native-ble-plx';

type Action =
  | { type: 'SET_DEVICE'; device: Device }
  | { type: 'CLEAR_DEVICE' }

type State = {
  connectedDevice: Device | null
}
type DeviceProviderProps = {
    children: React.ReactNode;
  }

const initialState: State = {
  connectedDevice: null
}

type DeviceContextType = {
  state: State
  dispatch: React.Dispatch<Action>
}

export const DeviceContext = createContext<DeviceContextType>({
  state: initialState,
  dispatch: () => null
});

const deviceReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_DEVICE':
      return {
        ...state,
        connectedDevice: action.device
      };
    case 'CLEAR_DEVICE':
      return {
        ...state,
        connectedDevice: null
      };
    default:
      return state;
  }
};

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(deviceReducer, initialState);

  return (
    <DeviceContext.Provider value={{ state, dispatch }}>
      {children}
    </DeviceContext.Provider>
  );
};
