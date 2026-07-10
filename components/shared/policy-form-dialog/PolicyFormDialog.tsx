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
import { useEntityFormMutation } from "@/hooks/use-entity-form-mutation"
import { getBaseUrl } from "@/lib/api"
import { type SyntheticEvent, useEffect, useState } from "react"
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

    const handleClose = () => {
        setPayload(INITIAL_FORM_STATE)
        setIsOpen(false)
    }

    const mutation = useEntityFormMutation<CreatePolicyDto | UpdatePolicyDto>({
        entityName: "Policy",
        queryKey: "policies",
        mode,
        createUrl: `${BASE_URL}/api/policies`,
        updateUrl: `${BASE_URL}/api/policies/${policy?.id}`,
        onSuccess: handleClose,
        onUpdateSuccess,
    })

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()

        const payloadBody: CreatePolicyDto | UpdatePolicyDto = {
            name: payload.name,
            description: payload.description || null,
            ref_name: payload.ref_name,
        }

        mutation.mutate(payloadBody)
    }

    const isLoading = mutation.isPending
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
