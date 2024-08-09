import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Button } from 'react-native';
import { MToken } from 'react-native-mtoken-sdk';
import { PowerAuth, PowerAuthActivation, PowerAuthAuthentication, type PowerAuthActivationCode, type PowerAuthActivationStatus } from 'react-native-powerauth-mobile-sdk';

export default function App() {

  const powerAuth = new PowerAuth("test-instance");
  const mtoken = new MToken(powerAuth);
  const pin = "1111";

  const [isActivated, setIsActivated] = useState<boolean | undefined>();
  const [status, setStatus] = useState<PowerAuthActivationStatus | undefined>();

  useEffect(() => {
    prepare().catch(log);
  }, []);

  const log = (err: any) => {
    console.log(err);
    Alert.alert("Error", `${JSON.stringify(err)}`);
  }

  const prepare = async (): Promise<void> => {
    if (!await powerAuth.isConfigured()) {
      await powerAuth.configure(
        "gfv6saZiwmtOAMk9iD1xyg==",
        "Pgd67vpBT6/Y+2fNBt7Sxg==",
        "BFNObd28hFHYfdAgYgb6oK+LFlO69WEwLXaU4dxMoQFC+/dZOusMvkmTNahC8Os3aDhzRZP8+J3gw6irSEOROY4=",
        "https://powerauth-dev.westeurope.cloudapp.azure.com/enrollment-server/",
        false
      )
    }

    let isActivated = await powerAuth.hasValidActivation();
    setIsActivated(isActivated);
    if (isActivated) {
      await updateStatus()
    }
  }

  const updateStatus = async () => {
    setStatus(undefined);
    setStatus(await powerAuth.fetchActivationStatus());
  }

  return (
    <View style={styles.container}>
      <Text>Is Activated: {isActivated ? "yes" : "no"}</Text>
      <Text>Activation status: {JSON.stringify(status)}</Text>
      <Button title='Activate and commit' onPress={async () => {
        try {
          await powerAuth.createActivation(PowerAuthActivation.createWithActivationCode("XGDD6-RC2NU-XVU4D-43N3Q", "React-Native-MtokenSDK-example"));
          await powerAuth.commitActivation(PowerAuthAuthentication.commitWithPassword(pin));
          Alert.alert("OK");
        } catch (err) {
          log(err);
        }
      }} />
      <Button title='Update status' onPress={async () => {
        try {
          await updateStatus();
        } catch (err) {
          log(err);
        }
      }} />
      <Button title='Fetch operations' onPress={async () => {
        try {
          let result = await mtoken.operationList();
          let jsonResult = JSON.stringify(result);
          console.log(jsonResult);
          Alert.alert(jsonResult);
        } catch (err) {
          log(err);
        }
      }} />
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
