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
import { RoleScopeType } from "@/constants/enums"
import { CreateRoleDto, UpdateRoleDto } from "@/dtos/RoleDto"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { type SyntheticEvent, useEffect, useState } from "react"
import { toast } from "sonner"
import { useRoleFormStore } from "./role-form-store"

interface RoleFormState {
    name: string
    description: string
    ref_name: string
    scope: RoleScopeType | ""
    channel_id: string
}

const INITIAL_FORM_STATE: RoleFormState = {
    name: "",
    description: "",
    ref_name: "",
    scope: "",
    channel_id: "",
}

const BASE_URL = getBaseUrl()

export function RoleFormDialog() {
    const [payload, setPayload] = useState<RoleFormState>(INITIAL_FORM_STATE)
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    const { isOpen, setIsOpen, mode, role, onUpdateSuccess } =
        useRoleFormStore()

    useEffect(() => {
        if (!isOpen) return

        if (mode === "edit" && role) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPayload({
                name: role.name,
                description: role.description ?? "",
                ref_name: role.ref_name,
                scope: role.scope as RoleScopeType,
                channel_id:
                    role.channel_id === null || role.channel_id === undefined
                        ? ""
                        : String(role.channel_id),
            })
        } else {
            setPayload(INITIAL_FORM_STATE)
        }
    }, [isOpen, mode, role])

    const handleChange =
        (field: keyof RoleFormState) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setPayload((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSelectChange =
        (field: keyof RoleFormState) => (value: string) =>
            setPayload((prev) => ({ ...prev, [field]: value }))

    const handleClose = () => {
        setPayload(INITIAL_FORM_STATE)
        setIsOpen(false)
    }

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (mode === "create") {
                await createRole()
            } else {
                await updateRole()
            }
        } finally {
            setIsLoading(false)
        }
    }

    const createRole = async () => {
        const payloadBody: CreateRoleDto = {
            name: payload.name,
            description: payload.description || null,
            ref_name: payload.ref_name,
            scope: payload.scope || RoleScopeType.global,
            channel_id: payload.channel_id
                ? Number.parseInt(payload.channel_id, 10)
                : null,
        }

        try {
            const response = await fetch(`${BASE_URL}/api/roles`, {
                method: "POST",
                body: JSON.stringify(payloadBody),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                handleClose()
                toast.success("Role has been created")
                queryClient.invalidateQueries({ queryKey: ["roles"] })
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to create role")
                toast.warning(error.message || "Failed to create role")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        }
    }

    const updateRole = async () => {
        const payloadBody: UpdateRoleDto = {
            name: payload.name,
            description: payload.description || null,
            ref_name: payload.ref_name,
            scope: payload.scope || RoleScopeType.global,
            channel_id: payload.channel_id
                ? Number.parseInt(payload.channel_id, 10)
                : null,
        }

        try {
            const response = await fetch(`${BASE_URL}/api/roles/${role?.id}`, {
                method: "PUT",
                body: JSON.stringify(payloadBody),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                handleClose()
                toast.success("Role has been updated")
                queryClient.invalidateQueries({ queryKey: ["roles"] })
                onUpdateSuccess?.()
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to update role")
                toast.warning(error.message || "Failed to update role")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        }
    }

    const isCreate = mode === "create"
    const submitButtonText = isCreate ? "Creating role..." : "Updating role..."

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-scroll sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>
                            {isCreate ? "Create Role" : "Edit Role"}
                        </DialogTitle>
                        <DialogDescription>
                            {isCreate
                                ? "Fill in the details to create a new role."
                                : "Make changes to the role information here. Click save when you're done."}
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={payload.name}
                                onChange={handleChange("name")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="ref_name">Reference Name</Label>
                            <Input
                                id="ref_name"
                                value={payload.ref_name}
                                onChange={handleChange("ref_name")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={payload.description}
                                onChange={handleChange("description")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="scope">Scope</Label>
                            <Select
                                value={payload.scope}
                                onValueChange={handleSelectChange("scope")}
                            >
                                <SelectTrigger id="scope" className="w-44">
                                    <SelectValue placeholder="Select scope" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.values(RoleScopeType).map(
                                            (scope) => (
                                                <SelectItem
                                                    key={scope}
                                                    value={scope}
                                                >
                                                    {scope}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <Label htmlFor="channel_id">Channel ID</Label>
                            <Input
                                id="channel_id"
                                type="number"
                                placeholder="Optional"
                                value={payload.channel_id}
                                onChange={handleChange("channel_id")}
                            />
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
                            {isLoading ? submitButtonText : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
