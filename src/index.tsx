import { PowerAuth, PowerAuthAuthentication } from 'react-native-powerauth-mobile-sdk';

export class MToken {

  acceptLanguage = "en";

  private pa: PowerAuth;
  private baseURL: String;

  constructor(powerAuth: PowerAuth) {
    this.pa = powerAuth;
    this.baseURL = powerAuth.configuration?.baseEndpointUrl ?? ""
    if (!this.baseURL.endsWith("/")) {
      this.baseURL = this.baseURL + "/";
    }
  }

  async operationList(): Promise<any> {

    return await (await this.postSignedWithToken(
      {},
      PowerAuthAuthentication.possession(),
      "api/auth/token/app/operation/list",
      "possession_universal"
    )).json();
  }

  private async postSignedWithToken(
    request: any,
    auth: PowerAuthAuthentication,
    endpoindPath: string,
    tokenName: string
  ): Promise<Response> {

    let method = "POST";
    let url = this.baseURL + endpoindPath;
    let token = await this.pa.tokenStore.requestAccessToken(tokenName, auth);
    let paHeader = await this.pa.tokenStore.generateHeaderForToken(token.tokenName);

    let jsonType = "application/json";
    let headers = new Headers();
    headers.set("Accept", jsonType);
    headers.set("Content-Type", jsonType);
    headers.set("Accept-Language", this.acceptLanguage);
    headers.set("User-Agent", "react-native-mtoken-sdk");
    headers.set(paHeader.key, paHeader.value);

    let result = await fetch( url, {
        method: method,
        headers: headers,
        body: JSON.stringify(request)
      }
    )

    return result
  }
}

