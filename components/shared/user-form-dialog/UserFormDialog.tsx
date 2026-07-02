"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { UserLevelType, UserStatusType } from "@/constants/enums"
import { UserDto } from "@/dtos/UserDto"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useUserFormStore } from "./user-form-store"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserDialogType = {
    open: boolean
    mode: "create" | "edit"
    user: UserDto | undefined
}

interface UserFormDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    mode: "create" | "edit"
    user?: UserDto
    /** Called after a successful update so the parent can refresh its data. */
    onUpdateSuccess?: () => void
}

interface UserFormState {
    username: string
    email: string
    first_name: string
    last_name: string
    password?: string
    status: UserStatusType | ""
    level: UserLevelType | ""
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_FORM_STATE: UserFormState = {
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    status: "",
    level: "",
}

const BASE_URL = getBaseUrl()

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserFormDialog() {
    const [payload, setPayload] = useState<UserFormState>(INITIAL_FORM_STATE)

    const { isOpen, setIsOpen, mode, user, onUpdateSuccess } =
        useUserFormStore()

    useEffect(() => {
        if (!isOpen) return

        if (mode === "edit" && user) {
            setPayload((prev) => ({
                ...prev,
                username: user.username ?? "",
                email: user.email ?? "",
                first_name: user.first_name ?? "",
                last_name: user.last_name ?? "",
                status: user.status,
                level: user.level,
            }))
        } else {
            setPayload(INITIAL_FORM_STATE)
        }
    }, [isOpen, mode, user])

    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    // Generic field updater — avoids a separate handler per field.
    const handleChange =
        (field: keyof UserFormState) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setPayload((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSelectChange =
        (field: keyof UserFormState) => (value: string) =>
            setPayload((prev) => ({ ...prev, [field]: value }))

    const handleClose = () => {
        setPayload(INITIAL_FORM_STATE)
        setIsOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (mode === "create") {
                await createUser()
            } else {
                await updateUser()
            }
        } finally {
            setIsLoading(false)
        }
    }

    const createUser = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/users`, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                handleClose()
                toast.success("User has been created")
                queryClient.invalidateQueries({ queryKey: ["users"] })
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to create user")
                toast.warning(error.message || "Failed to create user")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        }
    }

    const updateUser = async () => {
        // Exclude password from update payloads.
        const { password: _password, ...updatePayload } = payload

        try {
            const response = await fetch(`${BASE_URL}/api/users/${user?.id}`, {
                method: "PUT",
                body: JSON.stringify(updatePayload),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                handleClose()
                toast.success("User has been updated")
                queryClient.invalidateQueries({ queryKey: ["users"] })
                onUpdateSuccess?.()
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to update user")
                toast.warning(error.message || "Failed to update user")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        }
    }

    const isCreate = mode === "create"

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-scroll sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>
                            {isCreate ? "Create User" : "Edit User"}
                        </DialogTitle>
                        <DialogDescription>
                            {isCreate
                                ? "Fill in the details to create a new user."
                                : "Make changes to the user's information here. Click save when you're done."}
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                placeholder="andi123"
                                value={payload.username}
                                onChange={handleChange("username")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="andi@example.com"
                                value={payload.email}
                                onChange={handleChange("email")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                placeholder="Andi"
                                value={payload.first_name}
                                onChange={handleChange("first_name")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                placeholder="Mags"
                                value={payload.last_name}
                                onChange={handleChange("last_name")}
                            />
                        </Field>

                        {isCreate && (
                            <Field>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Enter password"
                                    value={payload.password}
                                    onChange={handleChange("password")}
                                />
                            </Field>
                        )}

                        <Field>
                            {/* Label says "Level" — htmlFor should match the select's id */}
                            <Label htmlFor="level">Level</Label>
                            <Select
                                value={payload.level}
                                onValueChange={handleSelectChange("level")}
                            >
                                <SelectTrigger id="level" className="w-[180px]">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.values(UserLevelType).map(
                                            (level) => (
                                                <SelectItem
                                                    key={level}
                                                    value={level}
                                                >
                                                    {level}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={payload.status}
                                onValueChange={handleSelectChange("status")}
                            >
                                <SelectTrigger
                                    id="status"
                                    className="w-[180px]"
                                >
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.values(UserStatusType).map(
                                            (status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? isCreate
                                    ? "Creating user..."
                                    : "Updating user..."
                                : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
