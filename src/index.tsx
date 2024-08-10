//
// Copyright 2024 Wultra s.r.o.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions
// and limitations under the License.
//

import { type MobileTokenUserOperation } from "./operations/MobileTokenUserOperation"
import { PowerAuth, PowerAuthAuthentication } from 'react-native-powerauth-mobile-sdk';

export type RequestProcessor = (name: RequestInit) => RequestInit;

/**
 * MobileToken class exposes API that enables to fetch, authorize or reject basic
 * operations created in the PowerAuth stack.
 */
export class MobileToken {

  /**
   * Accept language for the outgoing requests headers.
   * Default value is "en".
   * 
   * Standard RFC "Accept-Language" https://tools.ietf.org/html/rfc7231#section-5.3.5
   * Response texts are based on this setting. For example when "de" is set, server
   * will return operation texts in german (if available).
   */
  acceptLanguage = "en";

  private pa: PowerAuth;
  private baseURL: string;

  /**
   * 
   * @param powerAuth PowerAuth instance. Needs to be activated when calling any method of this class - othewise error will be thrown.
   * @param baseURL BaseURL of the server. If not provided, same URL as for PowerAuth it used.
   */
  constructor(powerAuth: PowerAuth, baseURL?: string) {
    this.pa = powerAuth;
    this.baseURL = baseURL ?? powerAuth.configuration?.baseEndpointUrl ?? ""
    if (!this.baseURL.endsWith("/")) {
      this.baseURL = this.baseURL + "/";
    }
  }

  /**
   * Retrieves user operations from the server.
   * 
   * @param requestProcessor You may modify the request via this processor. It's highly recommended to only modify HTTP headers.
   * @returns List of operations.
   */
  async operationList(requestProcessor?: RequestProcessor): Promise<MobileTokenResponse<MobileTokenUserOperation[]>> {
    return await this.postSignedWithToken<MobileTokenUserOperation[]>(
      {},
      PowerAuthAuthentication.possession(),
      "api/auth/token/app/operation/list",
      "possession_universal",
      true,
      requestProcessor
    );
  }

  /**
   * Retrieves specific operation from the server
   * 
   * @param operationId ID of the operation
   * @param requestProcessor You may modify the request via this processor. It's highly recommended to only modify HTTP headers.
   * @returns Operation detail.
   */
  async operationDetail(operationId: string, requestProcessor?: RequestProcessor): Promise<MobileTokenResponse<MobileTokenUserOperation>> {
    return await this.postSignedWithToken<MobileTokenUserOperation>(
      { requestObject: { id: operationId }},
      PowerAuthAuthentication.possession(),
      "api/auth/token/app/operation/detail",
      "possession_universal",
      true,
      requestProcessor
    );
  }

  private async postSignedWithToken<T>(
    requestData: any,
    auth: PowerAuthAuthentication,
    endpoindPath: string,
    tokenName: string,
    returnDataExpected: boolean,
    requestProcessor?: RequestProcessor
  ): Promise<MobileTokenResponse<T>> {
    let method = "POST";
    let url = this.baseURL + endpoindPath;
    let token = await this.pa.tokenStore.requestAccessToken(tokenName, auth);
    let paHeader = await this.pa.tokenStore.generateHeaderForToken(token.tokenName);

    let jsonType = "application/json";
    let headers = new Headers();
    headers.set("Accept", jsonType);
    headers.set("Content-Type", jsonType);
    headers.set("Accept-Language", this.acceptLanguage);
    headers.set("User-Agent", "react-native-mtoken-sdk"); // TODO: improve!
    headers.set(paHeader.key, paHeader.value);

    let request: RequestInit = {
      method: method,
      headers: headers,
      body: JSON.stringify(requestData)
    }

    if (requestProcessor) {
      request = requestProcessor(request);
    }

    let result = await fetch(url, request);
    let responseBody = await result.text()
    let response = JSON.parse(responseBody, (key: string, value: any) => {
      if (key == "operationExpires" || key == "operationCreated") {
        return new Date(value);
      }
      return value
    }) as  MobileTokenResponse<T>;

    console.log(response);

    if (response.status == "ERROR") {
      if (response.responseObject == undefined) {
        throw new MobileTokenException("Error retrieved but no error data", { ...result })
      }
      response.responseError = response.responseObject as any
      response.responseObject = undefined
    }

    if (response.status == "OK" && returnDataExpected && response.responseObject == undefined) {
      throw new MobileTokenException("No data object retieved.", { ...result })
    }

    return response;
  }
}

/** Possible logic errors during the API calls. */
export class MobileTokenException {

  description: string;
  additionalData?: any;
  
  constructor(description: string, additionalData?: any) {
    this.description = description;
    this.additionalData = additionalData;
  }
}

/** Response from the API. */
export interface MobileTokenResponse<T> {
  status: "OK" | "ERROR";
  responseError?: MobileTokenResponseError;
  responseObject?: T;
} 

/** Error object when error on the server happens. */
export interface MobileTokenResponseError {
  code: KnownRestApiError | string;
  message: string;
}

/** Known PowerAuth server error codes. */
enum KnownRestApiError {
    
  // COMMON ERRORS
  
  /// When unexpected error happened. */
  GenericError                     = "ERROR_GENERIC",
  
  /** General authentication failure (wrong password, wrong activation state, etc...) */
  AuthenticationFailure            = "POWERAUTH_AUTH_FAIL",
  /// Invalid request sent - missing request object in request */
  InvalidRequest                   = "INVALID_REQUEST",
  /// Activation is not valid (it is different from configured activation) */
  InvalidActivation                = "INVALID_ACTIVATION",
  /// Invalid application identifier is attempted for operation manipulation */
  InvalidApplication               = "INVALID_APPLICATION",
  /// Invalid operation identifier is attempted for operation manipulation */
  InvalidOperation                 = "INVALID_OPERATION",
  /// Error during activation */
  ActivationError                  = "ERR_ACTIVATION",
  /// Error in case that PowerAuth authentication fails */
  AuthenticationError              = "ERR_AUTHENTICATION",
  /// Error during secure vault unlocking */
  SecureVaultError                 = "ERR_SECURE_VAULT",
  /// Returned in case encryption or decryption fails */
  EncryptionError                  = "ERR_ENCRYPTION",
  
  // PUSH ERRORS

  /// Failed to register push notifications */
  PushRegistrationFailed           = "PUSH_REGISTRATION_FAILED",

  // OPERATIONS ERRORS
  
  /// Operation is already finished */
  OperationAlreadyFinished         = "OPERATION_ALREADY_FINISHED",
  /// Operation is already failed */
  OperationAlreadyFailed           = "OPERATION_ALREADY_FAILED",
  /// Operation is cancelled */
  OperationAlreadyCancelled        = "OPERATION_ALREADY_CANCELED",
  /// Operation is expired */
  OperationExpired                 = "OPERATION_EXPIRED",
  /// Operation authorization failed */
  OperationFailed                  = "OPERATION_FAILED",

  // Following errors in the current mtoken implementatation should not happen, so we're commenting them out to keep it simple

  // // ACTIVATION SPAWN ERRORS
  
  // /// Unable to fetch activation code.
  // ActivationCodeFailed             = "ACTIVATION_CODE_FAILED",
  
  // // IDENTITY ONBOARDING ERRORS
  
  // /// Onboarding process failed or failed to start
  // OnboardingFailed                 = "ONBOARDING_FAILED",
  // /// An onboarding process limit reached (e.g. too many reset attempts for identity verification or maximum error score exceeded).
  // OnboardingLimitReached           = "ONBOARDING_PROCESS_LIMIT_REACHED",
  // /// Too many attempts to start an onboarding process for a user.
  // OnboardingTooManyProcesses       = "TOO_MANY_ONBOARDING_PROCESSES",
  // /// Failed to resend onboarding OTP (probably requested too soon)
  // OnboardingOtpFailed              = "ONBOARDING_OTP_FAILED",
  // /// Document is invalid
  // InvalidDocument                  = "INVALID_DOCUMENT",
  // /// Document submit failed
  // DocumentSubmitFailed             = "DOCUMENT_SUBMIT_FAILED",
  // /// Identity verification failed
  // IdentityVerificationFailed       = "IDENTITY_VERIFICATION_FAILED",
  // /// Identity verification limit reached (e.g. exceeded number of upload attempts).
  // IdentityVerificationLimitReached = "IDENTITY_VERIFICATION_LIMIT_REACHED",
  // /// Verification of documents failed
  // DocumentVerificationFailed       = "DOCUMENT_VERIFICATION_FAILED",
  // /// Presence check failed
  // PresenceCheckFailed              = "PRESENCE_CHECK_FAILED",
  // /// Presence check is not enabled
  // PresenceCheckNotEnabled          = "PRESENCE_CHECK_NOT_ENABLED",
  // /// Maximum limit of presence check attempts was exceeded.
  // PresenceCheckLimitEached         = "PRESENCE_CHECK_LIMIT_REACHED",
  // /// Too many same requests
  // TooManyRequests                  = "TOO_MANY_REQUESTS",
  
  // // OTHER
  
  // /// Communication with remote system failed
  // RemoteCommunicationError         = "REMOTE_COMMUNICATION_ERROR"
}