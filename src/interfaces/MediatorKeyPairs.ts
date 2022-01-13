// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ActorKeyPairs, KeyPair } from "./api";

export interface MediatorKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
    provider: KeyPair;
}
