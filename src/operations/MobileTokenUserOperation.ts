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

import type { MobileTokenOperation } from "./MobileTokenOperation";
import type { MobileTokenOperationAttribute } from "./MobileTokenOperationAttribute";

/**
 * `UserOperation` is object returned from the backend that can be either approved or rejected.
 * It is usually visually presented to the user as a non-editable form with information about
 * the real-world operation (for example login or payment).
 */
export interface MobileTokenUserOperation extends MobileTokenOperation {
    /**
     * System name of the operation (for example login).
     * 
     * Name of the operation shouldn't be visible to the user. You can use it to distinguish how 
     * the operation will be presented. (for example when the template for login is different than payment).
     */
    name: string;
    
    /**
     * Date and time when the operation was created.
     */ 
    operationCreated: Date;
    
    /**
     * Date and time when the operation will expire.
     * 
     * You should never use this for hiding the operation (visually) from the user
     * as the time set for the user system can differ with the backend.
     */ 
    operationExpires: Date;
    
    /**
     * Data that should be presented to the user.
     */ 
    formData: MobileTokenOperationFormData;
    
    /** Enum-like reason why the status has changed.
     * 
     *  Max 32 characters are expected. Possible values depend on the backend implementation and configuration.
     */ 
    statusReason?: string;
    
    /**
     * Allowed signature types.
     * 
     * This hints if the operation needs a 2nd factor or can be approved simply by
     * tapping an approve button. If the operation requires 2FA, this value also hints if
     * the user may use the biometry, or if a password is required.
     */ 
    allowedSignatureType: MobileTokenAllowedOperationSignature;
    
    // Following features are not supported in the react-native yet and will be added later.
    // If you need it for your project, please raise an issue in the repository or contact Wultra support.

    // ui: MobileTokenOerationUIData?
    // proximityCheck: MobileTokenProximityCheck?
}

type MtokenSignatureFactor = "possession" | "possession_knowledge" | "possession_biometry";

/** Allowed signature types that can be used for operation approval. */
export interface MobileTokenAllowedOperationSignature {
    
    /** If operation should be signed with 1 or 2 factor authentication. */
    type: "1FA" | "2FA";

    /** What factors are needed to signing this operation. */
    variants: MtokenSignatureFactor[];
}

/**
 * Operation data, that should be visible to the user.
 * 
 *  Note that the data returned from the server are localized based on the `MobileToken.acceptLanguage` property.
 */
export interface MobileTokenOperationFormData {
    
    /** Title of the operation */
    title: string;
    
    /** Message for the user. */
    message: string
    
    /**
     * Texts for the result of the operation
     * 
     * This includes messages for different outcomes of the operation such as success, rejection, and failure.
     */
    resultTexts?: MobileTokenResultTexts;
     
    /**
     * Other attributes.
     * 
     * Note that attributes can be presented with different classes (Starting with `MobileTokenOperationAttribute*`) based on the attribute type.  
     */ 
    attributes: MobileTokenOperationAttribute[];
}

/**
 * Texts for the result of the operation.
 * 
 * This includes messages for different outcomes of the operation such as success, rejection, and failure.
 */
export interface MobileTokenResultTexts {
    /** Optional message to be displayed when the approval of the operation is successful. */
    success?: string;
    
    /** Optional message to be displayed when the operation approval or rejection fails. */
    failure?: string;
    
    /** Optional message to be displayed when the operation is rejected. */
    reject?: string;
}

