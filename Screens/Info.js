import React from 'react';
import { SafeAreaView, Text } from 'react-native';

function Info(props) {
    return (
        <SafeAreaView style = { {flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text>Device Info!</Text>
        </SafeAreaView>
    );
}

export default Info;