"use client"

import { ChannelDto } from "@/dtos/ChannelDto"
import { create } from "zustand"

type ChannelFormState = {
    isOpen: boolean
    setIsOpen: (value: boolean) => void

    mode: "edit" | "create"
    setMode: (value: "edit" | "create") => void

    channel: ChannelDto | null
    setChannel: (channel: ChannelDto | null) => void

    onUpdateSuccess?: () => void
    setOnUpdateSuccess: (callback: () => void) => void
}

export const useChannelFormStore = create<ChannelFormState>((set) => ({
    isOpen: false,

    setIsOpen: (value: boolean) => {
        set({
            isOpen: value,
        })
    },

    mode: "create",
    setMode: (value: "edit" | "create") => {
        set({
            mode: value,
        })
    },

    channel: null,
    setChannel: (channel: ChannelDto | null) => {
        set({
            channel: channel,
        })
    },

    onUpdateSuccess: undefined,
    setOnUpdateSuccess: (callback: () => void) => {
        set({
            onUpdateSuccess: callback,
        })
    },
}))
