// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { equal } from "assert"
import { formatDatetime } from "../helpers/time"
import { Status } from "../interfaces"
import { User } from "../user"
import {
    adminKeys,
    backend,
    mediator,
    resetDB,
    verifiedProvider,
} from "../testing/fixtures"

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

describe("Provider.cancelAppointments()", function () {
    it("we should be able to publish appointments", async function () {
        dayjs.extend(utc)
        var result;

        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const vp = await verifiedProvider(be, keys, med)

        // tomorrow 3 pm

        const date = dayjs().utc().add(1, 'day').hour(15).minute(0).second(0)

        const app = await vp.createAppointment(
            15,
            "moderna",
            5,
            formatDatetime(date)
        )

        const publishResult = await vp.publishAppointments([app])

        if (publishResult.status !== Status.Succeeded)
            throw new Error("cannot publish appointments")

        const fromDate = dayjs().utc()
        const toDate = dayjs().utc().add(1, 'day')

        const getResult = await vp.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
        })

        if (getResult.status !== Status.Succeeded)
            throw new Error("cannot get appointments")
        if (getResult.appointments.length != 1)
            throw new Error("expected 5 appointments")

        const user = new User("main", be)
        user.initialize()
        user.queueData = {
            zipCode: "10707",
        }
        user.contactData = {
            name: "Max Mustermann",
        }

        result = await user.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
            zipCode: user.queueData!.zipCode,
        })

        if (result.status !== Status.Succeeded)
            throw new Error("should not fail")

        if (result.appointments.length !== 1)
            throw new Error("should return one appointment")


        await vp.cancelAppointment(app) 


        result = await user.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
            zipCode: user.queueData!.zipCode,
        })

        if (result.status !== Status.Succeeded)
            throw new Error("should not fail")

        if (result.appointments.length !== 0)
            throw new Error("should return no appointments")

    })
})

