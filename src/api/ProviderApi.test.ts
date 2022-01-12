import { TestContext } from "../../tests/TestContext";
import { dayjs } from "../utils";
import { ProviderBackup } from "./interfaces";

describe("ProviderApi", () => {
    describe("cancel appointments", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        it("should create appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            // tomorrow 3 pm
            const date = dayjs()
                .utc()
                .add(1, "day")
                .hour(15)
                .minute(0)
                .second(0)
                .toDate();

            const appointment = context.providerApi.createAppointment(
                date,
                15,
                "moderna",
                5,
                provider,
                providerKeyPairs
            );

            expect(appointment).toHaveProperty("id");
            expect(appointment.startDate).toEqual(date);
        });

        it("should publish appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = context.createUnpublishedAppointment({
                provider,
                providerKeyPairs,
            });

            const publishResult = await context.providerApi.publishAppointments(
                [appointment],
                providerKeyPairs
            );

            expect(publishResult).toEqual([appointment]);
        });

        it("should retrieve published appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(appointments[0].id).toEqual(appointment.id);
        });

        it("should cancel appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const result = await context.providerApi.cancelAppointment(
                appointment,
                providerKeyPairs
            );

            expect(result[0].slotData).toHaveLength(0);
        });

        it("should not retrieve canceled appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            await context.providerApi.cancelAppointment(
                appointment,
                providerKeyPairs
            );

            const appointments = await context.anonymousApi.getAppointments(
                "10707",
                from,
                to,
                10
            );

            expect(appointments).toHaveLength(0);
        });
    });

    describe("verify a provider", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        it("should create new provider", async () => {
            const providerKeyPairs =
                await context.providerApi.generateKeyPairs();

            const provider = await context.providerApi.storeProvider(
                context.defaultProviderData,
                providerKeyPairs
            );

            expect(provider).toHaveProperty("id");
            expect(provider.name).toEqual(context.defaultProviderData.name);
        });

        it("should retrieve no data while provider is pending", async () => {
            const { providerKeyPairs } =
                await context.createUnverifiedProvider();

            const { verifiedProvider } =
                await context.providerApi.checkProvider(providerKeyPairs);

            expect(verifiedProvider).toBeNull();
        });

        it("should not get own appointments while provider is unverified", async () => {
            const { providerKeyPairs } =
                await context.createUnverifiedProvider();

            const result = await context.providerApi.getProviderAppointments(
                from,
                to,
                providerKeyPairs
            );

            expect(result).toHaveLength(0);
        });

        it("should get pending providers", async () => {
            await context.createUnverifiedProvider();

            const providerDatas = await context.mediatorApi.getPendingProviders(
                context.mediatorKeyPairs
            );

            expect(providerDatas).toHaveLength(1);
        });

        it("should verify provider", async () => {
            const { provider } = await context.createUnverifiedProvider();

            const result = await context.mediatorApi.confirmProvider(
                provider,
                context.mediatorKeyPairs
            );

            expect(result).toEqual(provider);
        });

        it("should get data for verified provider", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const { verifiedProvider } =
                await context.providerApi.checkProvider(providerKeyPairs);

            expect(verifiedProvider).toEqual(provider);
        });

        it("should update provider", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            await context.providerApi.storeProvider(
                {
                    ...provider,
                    name: "foobar",
                },
                providerKeyPairs
            );

            const providerData = await context.providerApi.checkProvider(
                providerKeyPairs
            );

            expect(providerData?.verifiedProvider).toEqual(provider);
        });
    });

    describe("appointment-series", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should create and publish series", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const startAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(7)
                .minute(0)
                .second(0)
                .toDate();

            const endAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(23)
                .minute(0)
                .second(0)
                .toDate();

            const appointmentSeries =
                context.providerApi.createAppointmentSeries(
                    startAt,
                    endAt,
                    5,
                    5,
                    "biontech",
                    provider,
                    providerKeyPairs
                );

            expect(appointmentSeries.appointments).toHaveLength(192);

            const result = await context.providerApi.publishAppointments(
                appointmentSeries.appointments,
                providerKeyPairs
            );

            expect(result).toHaveLength(192);
            expect(result).toEqual(appointmentSeries.appointments);

            expect(result[0].properties.seriesId).toEqual(
                appointmentSeries.appointments[0].properties.seriesId
            );
        });
    });

    describe("backup", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should backup and restore", async () => {
            const { provider } = await context.createVerifiedProvider();

            const secret = context.providerApi.generateSecret();

            const providerBackup: ProviderBackup = {
                verifiedProvider: provider,
            };

            const result = await context.providerApi.backupData(
                providerBackup,
                secret
            );

            expect(result).toHaveProperty("data");

            const restore = await context.providerApi.restoreFromBackup(secret);

            expect(providerBackup).toEqual(restore);
        });
    });
});
