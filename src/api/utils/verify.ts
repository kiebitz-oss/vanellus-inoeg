// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { base64ToBuffer, stringToArrayBuffer } from ".";
import { SignedData } from "../interfaces";

export const verify = async (keys: string[], signedData: SignedData) => {
    const signature = base64ToBuffer(signedData.signature);
    const data = stringToArrayBuffer(signedData.data);

    for (const keyData of keys) {
        const keyDataBuffer = base64ToBuffer(keyData);

        try {
            // we import the key data
            const cryptoKey = await crypto.subtle.importKey(
                "spki",
                keyDataBuffer,
                { name: "ECDSA", namedCurve: "P-256" },
                false,
                ["verify"]
            );

            const isVerified = await crypto.subtle.verify(
                { name: "ECDSA", hash: "SHA-256" },
                cryptoKey,
                signature,
                data
            );

            if (isVerified === true) {
                return true;
            }
        } catch (e) {
            continue;
        }
    }

    // no key signature was valid
    return false;
};
