"use client"

import { UserDto } from "@/dtos/UserDto"
import { create } from "zustand"

type UserFormState = {
    isOpen: boolean
    setIsOpen: (value: boolean) => void

    mode: "edit" | "create"
    setMode: (value: "edit" | "create") => void

    user: UserDto | null
    setUser: (user: UserDto | null) => void

    onUpdateSuccess?: () => void
    setOnUpdateSuccess: (callback: () => void) => void
}

export const useUserFormStore = create<UserFormState>((set) => ({
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

    user: null,
    setUser: (user: UserDto | null) => {
        set({
            user: user,
        })
    },

    onUpdateSuccess: undefined,
    setOnUpdateSuccess: (callback: () => void) => {
        set({
            onUpdateSuccess: callback,
        })
    },
}))
