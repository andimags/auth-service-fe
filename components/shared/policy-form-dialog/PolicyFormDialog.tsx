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
import { CreatePolicyDto, UpdatePolicyDto } from "@/dtos/PolicyDto"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { type SyntheticEvent, useEffect, useState } from "react"
import { toast } from "sonner"
import { usePolicyFormStore } from "./policy-form-store"

interface PolicyFormState {
    name: string
    description: string
    ref_name: string
}

const INITIAL_FORM_STATE: PolicyFormState = {
    name: "",
    description: "",
    ref_name: "",
}

const BASE_URL = getBaseUrl()

export function PolicyFormDialog() {
    const [payload, setPayload] = useState<PolicyFormState>(INITIAL_FORM_STATE)
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    const { isOpen, setIsOpen, mode, policy, onUpdateSuccess } =
        usePolicyFormStore()

    useEffect(() => {
        if (!isOpen) return

        if (mode === "edit" && policy) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPayload({
                name: policy.name,
                description: policy.description ?? "",
                ref_name: policy.ref_name,
            })
        } else {
            setPayload(INITIAL_FORM_STATE)
        }
    }, [isOpen, mode, policy])

    const handleChange =
        (field: keyof PolicyFormState) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setPayload((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSelectChange =
        (field: keyof PolicyFormState) => (value: string) =>
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
                await createPolicy()
            } else {
                await updatePolicy()
            }
        } finally {
            setIsLoading(false)
        }
    }

    const createPolicy = async () => {
        const payloadBody: CreatePolicyDto = {
            name: payload.name,
            description: payload.description || null,
            ref_name: payload.ref_name,
        }

        try {
            const response = await fetch(`${BASE_URL}/api/policies`, {
                method: "POST",
                body: JSON.stringify(payloadBody),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                handleClose()
                toast.success("Policy has been created")
                queryClient.invalidateQueries({ queryKey: ["policies"] })
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to create policy")
                toast.warning(error.message || "Failed to create policy")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        }
    }

    const updatePolicy = async () => {
        const payloadBody: UpdatePolicyDto = {
            name: payload.name,
            description: payload.description || null,
            ref_name: payload.ref_name,
        }

        try {
            const response = await fetch(`${BASE_URL}/api/policies/${policy?.id}`, {
                method: "PUT",
                body: JSON.stringify(payloadBody),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                handleClose()
                toast.success("Policy has been updated")
                queryClient.invalidateQueries({ queryKey: ["policies"] })
                onUpdateSuccess?.()
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to update policy")
                toast.warning(error.message || "Failed to update policy")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        }
    }

    const isCreate = mode === "create"
    const submitButtonText = isCreate
        ? "Creating policy..."
        : "Updating policy..."

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-scroll sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>
                            {isCreate ? "Create Policy" : "Edit Policy"}
                        </DialogTitle>
                        <DialogDescription>
                            {isCreate
                                ? "Fill in the details to create a new policy."
                                : "Make changes to the policy information here. Click save when you're done."}
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
