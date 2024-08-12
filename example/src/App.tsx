import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Button } from 'react-native';
import { MobileToken } from 'react-native-mtoken-sdk';
import { PowerAuth, PowerAuthActivation, PowerAuthAuthentication, type PowerAuthActivationStatus } from 'react-native-powerauth-mobile-sdk';

export default function App() {

  const powerAuth = new PowerAuth("test-instance");
  const mtoken = new MobileToken(powerAuth);
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
        "appKey",
        "appSecret",
        "masterPublicKey",
        "https://yoururl.com/enrollment-server/",
        false
      )
    }

    let isActivated = await powerAuth.hasValidActivation();
    setIsActivated(isActivated);
    if (isActivated) {
      await updateStatus()
    }

    mtoken.acceptLanguage = "cs";
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
          let json = JSON.stringify(result);
          console.log(json);
          if (result.responseObject) {
            Alert.alert(json);
          } else if (result.responseError) {
            Alert.alert(`${result.responseError.code}`, `${result.responseError.message}`);
          }
        } catch (err) {
          log(err);
        }
      }} />
      <Button title='Fetch operation detail' onPress={async () => {
        try {
          let result = await mtoken.operationList();
          console.log(JSON.stringify(result));
          if (result.responseObject) {
            if (result.responseObject[0]) {
              let detail = await mtoken.operationDetail(result.responseObject[0].id);
              Alert.alert("OperatioDetailMessage", `${detail.responseObject?.operationCreated.toLocaleString()}\n${detail.responseObject?.formData.title}`)
            } else {
              Alert.alert("No operation in the list")
            }
          } else if (result.responseError) {
            Alert.alert(`${result.responseError.code}`, `${result.responseError.message}`);
          }

        } catch (err) {
          log(err);
        }
      }} />
      <Button title='Auhtorize first operation' onPress={async () => {
        try {
          let list = await mtoken.operationList();
          console.log(JSON.stringify(list));
          if (list.responseObject) {
            if (list.responseObject[0]) {
              let response = await mtoken.authorize(list.responseObject[0], PowerAuthAuthentication.password(pin));
              Alert.alert("Authorize Result", `${response.status}`)
            } else {
              Alert.alert("No operation in the list")
            }
          } else if (list.responseError) {
            Alert.alert(`${list.responseError.code}`, `${list.responseError.message}`);
          }

        } catch (err) {
          log(err);
        }
      }} />
      <Button title='Reject first operation' onPress={async () => {
        try {
          let list = await mtoken.operationList();
          console.log(JSON.stringify(list));
          if (list.responseObject) {
            if (list.responseObject[0]) {
              let response= await mtoken.reject(list.responseObject[0].id, "HELLO_FROM_REACT");
              Alert.alert("Reject Result", `${response.status}`)
            } else {
              Alert.alert("No operation in the list")
            }
          } else if (list.responseError) {
            Alert.alert(`${list.responseError.code}`, `${list.responseError.message}`);
          }

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
