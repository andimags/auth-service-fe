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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PermissionAccessLevelType } from "@/constants/enums"
import { CreatePermissionDto, UpdatePermissionDto } from "@/dtos/PermissionDto"
import { useEntityFormMutation } from "@/hooks/use-entity-form-mutation"
import { getBaseUrl } from "@/lib/api"
import { type SyntheticEvent, useEffect, useState } from "react"
import { usePermissionFormStore } from "./permission-form-store"

interface PermissionFormState {
    name: string
    description: string
    ref_name: string
    module: string
    scope: string
    access_level: PermissionAccessLevelType
}

const INITIAL_FORM_STATE: PermissionFormState = {
    name: "",
    description: "",
    ref_name: "",
    module: "",
    scope: "global",
    access_level: PermissionAccessLevelType.read,
}

const BASE_URL = getBaseUrl()

export function PermissionFormDialog() {
    const [payload, setPayload] =
        useState<PermissionFormState>(INITIAL_FORM_STATE)

    const { isOpen, setIsOpen, mode, permission, onUpdateSuccess } =
        usePermissionFormStore()

    useEffect(() => {
        if (!isOpen) return

        if (mode === "edit" && permission) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPayload({
                name: permission.name,
                description: permission.description ?? "",
                ref_name: permission.ref_name,
                module: permission.module,
                scope: "global",
                access_level: permission.access_level,
            })
        } else {
            setPayload(INITIAL_FORM_STATE)
        }
    }, [isOpen, mode, permission])

    const handleChange =
        (field: keyof PermissionFormState) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setPayload((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSelectChange =
        (field: keyof PermissionFormState) => (value: string) =>
            setPayload((prev) => ({
                ...prev,
                [field]: value as PermissionAccessLevelType,
            }))

    const handleClose = () => {
        setPayload(INITIAL_FORM_STATE)
        setIsOpen(false)
    }

    const mutation = useEntityFormMutation<
        CreatePermissionDto | UpdatePermissionDto
    >({
        entityName: "Permission",
        queryKey: "permissions",
        mode,
        createUrl: `${BASE_URL}/api/permissions`,
        updateUrl: `${BASE_URL}/api/permissions/${permission?.id}`,
        onSuccess: handleClose,
        onUpdateSuccess,
    })

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()

        const payloadBody: CreatePermissionDto | UpdatePermissionDto = {
            name: payload.name,
            description: payload.description || null,
            ref_name: payload.ref_name,
            module: payload.module,
            scope: payload.scope,
            access_level: payload.access_level,
        }

        mutation.mutate(payloadBody)
    }

    const isLoading = mutation.isPending
    const isCreate = mode === "create"
    const submitButtonText = isCreate
        ? "Creating permission..."
        : "Updating permission..."

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-scroll sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>
                            {isCreate ? "Create Permission" : "Edit Permission"}
                        </DialogTitle>
                        <DialogDescription>
                            {isCreate
                                ? "Fill in the details to create a new permission."
                                : "Make changes to the permission information here. Click save when you're done."}
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
                            <Label htmlFor="module">Module</Label>
                            <Input
                                id="module"
                                value={payload.module}
                                onChange={handleChange("module")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="access_level">Access Level</Label>
                            <Select
                                value={payload.access_level}
                                onValueChange={handleSelectChange(
                                    "access_level"
                                )}
                            >
                                <SelectTrigger id="access_level">
                                    <SelectValue placeholder="Select access level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(
                                        PermissionAccessLevelType
                                    ).map((level) => (
                                        <SelectItem key={level} value={level}>
                                            {level.charAt(0).toUpperCase() +
                                                level.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={payload.description}
                                onChange={handleChange("description")}
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
