import { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { multiply, testPowerAuthCode } from 'react-native-mtoken-sdk';
import { type PowerAuthActivationCode } from 'react-native-powerauth-mobile-sdk';

export default function App() {

  // to test the module
  const [result, setResult] = useState<number | undefined>();
  const [actCode, setActCode] = useState<PowerAuthActivationCode | undefined>();

  useEffect(() => {
    multiply(3, 7).then(setResult);
    testPowerAuthCode().then(setActCode)
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
      <Text>Parsed activaiton code: {actCode?.activationCode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
