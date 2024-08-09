import { PowerAuthActivationCodeUtil, type PowerAuthActivationCode } from 'react-native-powerauth-mobile-sdk';

export function multiply(a: number, b: number): Promise<number> {
  return Promise.resolve(a * b);
}

export function testPowerAuthCode(): Promise<PowerAuthActivationCode > {
  return PowerAuthActivationCodeUtil.parseActivationCode("AAAAA-AAAAA-AAAAA-AAAAA");
}
