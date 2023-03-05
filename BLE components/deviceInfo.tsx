import { useEffect, useState } from "react";
import { Base64, BleError, Characteristic, Device } from "react-native-ble-plx";
import {encode, decode} from 'base-64';


//List of Services and characteristics provided by the Nordic microcontroller
const NUS_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const TX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';

interface request {
    command: Base64;
    timeoutID: number;
    resolve?: (result: string) => void;
  }
interface dataFromDevice {
    FWVer: string;
    telemetry: string;
    triggerPressed: boolean;
    pinPressed: boolean;
    makeRequest(command: string, device: Device): Promise<string>;
    startStreamingData: (device: Device, command: string) => Promise<void>;
}
let activeRequest: request | undefined = undefined;
function deviceInfo(): dataFromDevice {
    const [FWVer, setFWVer] = useState<string>('');
    const [telemetry, setTelemetry] = useState<string>('');
    const [triggerPressed, setTriggerPressed] = useState<boolean>(false);
    const [pinPressed, setPinPressed] = useState<boolean>(false);

    //This function expression accepts a command and make a request
    const makeRequest = async (command: string, device: Device) => {
        //whenever a request is make reset FWver string and telemetry string
        setTelemetry('');
        setFWVer('');
        if (activeRequest !== undefined) {
        return Promise.reject("Request already underway!");
        }
        device.monitorCharacteristicForService(
            NUS_UUID,
            RX_CHARACTERISTIC,
            (error, characteristic) => onRXData(error, characteristic),
        );
        let ret = new Promise<string>(async (resolve, reject) => {
            console.log('TX: ', command);
            const _ = await device.writeCharacteristicWithoutResponseForService(
                NUS_UUID,
                TX_CHARACTERISTIC,
                encode(command));
            let id = setTimeout(() => {
                activeRequest = undefined;
                reject("Timeout occurred");
            }, 1000);
            if (activeRequest !== undefined) {
                activeRequest.timeoutID = id;
                activeRequest.resolve = resolve;
            }
        });
        activeRequest = {
        command: command,
        timeoutID: -1,
        }
        if(ret != null){
            if(command === 'tv'){
                setFWVer(await ret);
            }else if(command === 'TV10'){
                // Also trigger telemetry readback
                setTelemetry(await ret);
            }
        }
        return ret;
    };
    //This function expression manages the RX characteristic. It checks for possible errors and check commands
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
        if ((activeRequest !== undefined)&&(activeRequest.command == 'tV')) {
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
  
  
    const startStreamingData = async (device: Device, commands: string) => {
        if (device) {
        try {
            device.monitorCharacteristicForService(
            NUS_UUID,
            RX_CHARACTERISTIC,
            (error, characteristic) => onRXData(error, characteristic),
            );
            // Go ahead and retreive the firmware version
            if(commands === 'tv'){
                setFWVer(await makeRequest("tv", device));
            }else if(commands === 'tv10'){
                // Also trigger telemetry readback
                setTelemetry(await makeRequest("tV10", device));
            }
        } catch(e) {
            console.log("Error setting up connection", e);
        }
        } else {
        console.log('No Device Connected');
        }
    };

    return {
        FWVer,
        telemetry,
        triggerPressed,
        pinPressed,
        makeRequest,
        startStreamingData
    }
}
export default deviceInfo;