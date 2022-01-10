import { AnonymousApi, MediatorApi, ProviderApi } from ".";
import {
    createVerifiedProvider,
    getAdminApi,
    getAnonymousApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { dayjs } from "../utils";
import {
    AdminKeyPairs,
    MediatorKeyPairs,
    Provider,
    ProviderKeyPairs,
} from "./interfaces";

let adminKeyPairs: AdminKeyPairs;
let providerKeyPairs: ProviderKeyPairs;
let providerApi: ProviderApi;
let provider: Provider;
let mediatorApi: MediatorApi;
let mediatorKeyPairs: MediatorKeyPairs;
let anonymousApi: AnonymousApi;

beforeEach(async () => {
    const adminResult = await getAdminApi();

    // we reset the database
    await adminResult.adminApi.resetAppointmentsDb(adminResult.adminKeyPairs);

    adminKeyPairs = adminResult.adminKeyPairs;

    anonymousApi = getAnonymousApi();

    const providerResult = await getProviderApi();

    providerKeyPairs = providerResult.providerKeyPairs;
    providerApi = providerResult.providerApi;

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    mediatorApi = mediatorResult.mediatorApi;
    mediatorKeyPairs = mediatorResult.mediatorKeyPairs;

    provider = await createVerifiedProvider(providerKeyPairs, mediatorKeyPairs);
});

describe("AnonymousApi", () => {
    it("should be able to get appointments", async () => {
        // tomorrow 3 pm
        const date = dayjs()
            .utc()
            .add(1, "day")
            .hour(15)
            .minute(0)
            .second(0)
            .toDate();

        const unpublishedAppointment = providerApi.createAppointment(
            date,
            15,
            "moderna",
            5,
            provider,
            providerKeyPairs
        );

        const isSuccess = await providerApi.publishAppointments(
            [unpublishedAppointment],
            providerKeyPairs
        );

        expect(isSuccess).toBeTruthy();

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "days").toDate();

        const providerAppointments =
            await anonymousApi.getAppointmentsByZipCode("10707", 10, from, to);

        expect(providerAppointments).toHaveLength(1);

        const appointment = await anonymousApi.getAppointment(
            providerAppointments[0].id,
            providerAppointments[0].provider.id
        );

        expect(appointment.id).toEqual(unpublishedAppointment.id);
    });

    it("should create and authenticate a provider and work with appointments", async () => {
        //create providers
        const providerData = {
            name: "Max Mustermann",
            street: "Musterstr. 23",
            city: "Berlin",
            zipCode: "10115",
            description: "",
            email: "max@mustermann.de",
            accessible: true,
        };

        const k1 = await providerApi.generateKeyPairs();
        const p1 = await providerApi.storeProvider(providerData, k1);

        expect(p1).toHaveProperty("name");

        providerData.zipCode = "60312";
        const k2 = await providerApi.generateKeyPairs();
        const p2 = await providerApi.storeProvider(providerData, k2);

        expect(p2).toHaveProperty("name");

        providerData.zipCode = "65936";
        const k3 = await providerApi.generateKeyPairs();
        const p3 = await providerApi.storeProvider(providerData, k3);

        expect(p3).toHaveProperty("name");

        providerData.zipCode = "96050";
        const k4 = await providerApi.generateKeyPairs();
        const p4 = await providerApi.storeProvider(providerData, k4);

        expect(p4).toHaveProperty("name");

        // query providers
        const noProviders = await anonymousApi.getProvidersByZipCode(
            "60000",
            "69999"
        );

        expect(noProviders).toHaveLength(0);

        // disabled until id is added to getPendingProviders
        // // verify providers
        // const verifiedProviders = await mediatorApi.getVerifiedProviders(
        //     mediatorKeyPairs
        // );

        // for (const pendingProvider of pendingProviders) {
        //     const verifiedResult = await mediatorApi.verifyProvider(
        //         pendingProvider,
        //         mediatorKeyPairs
        //     );

        //     expect(verifiedResult).toHaveProperty("name");
        // }

        // // query providers
        // const providers = await anonymousApi.getProvidersByZipCode(
        //     "60000",
        //     "69999"
        // );

        // expect(providers).toHaveLength(2);
        // expect(providers.map((provider) => provider.zipCode).sort()).toEqual([
        //     "60312",
        //     "65936",
        // ]);
    });

    it("we should be able to get the public keys anonymously", async () => {
        const publicKeys = await anonymousApi.getKeys();

        expect(publicKeys.rootKey).toEqual(adminKeyPairs.signing.publicKey);
        expect(publicKeys.tokenKey).toEqual(adminKeyPairs.token.publicKey);
        expect(publicKeys.providerData).toEqual(
            adminKeyPairs.provider.publicKey
        );
    });
});
