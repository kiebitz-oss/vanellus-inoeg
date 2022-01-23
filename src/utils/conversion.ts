// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { base32Decode, base32Encode } from "@ctrl/ts-base32";
import { Buffer } from "buffer";

export const encodeBase32 = (string: string | Buffer) => {
    return base32Encode(Buffer.from(string), "Crockford");
};

export const decodeBase32 = (base32: string) => {
    return Buffer.from(base32Decode(base32, "Crockford")).toString();
};

export const encodeBase64url = (string: string | Buffer) => {
    return Buffer.from(string)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
};

export const decodeBase64url = (base64url: string) => {
    const string = Buffer.from(base64url, "base64").toString();

    return (string + "===".slice((string.length + 3) % 4))
        .replace(/-/g, "+")
        .replace(/_/g, "/");
};

export const bufferToBase64 = (buffer: ArrayBufferLike) => {
    return Buffer.from(buffer).toString("base64");
};

export const base64ToBuffer = (base64: string) => {
    return Buffer.from(base64, "base64");
};

export const stringToArrayBuffer = (str: string) => {
    return new TextEncoder().encode(str);
};

export const arrayBufferToString = (buf: ArrayBufferLike) => {
    return new TextDecoder().decode(new Uint8Array(buf));
};
