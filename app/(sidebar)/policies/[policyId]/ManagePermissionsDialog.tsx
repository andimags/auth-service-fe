"use client"

import {
    MultiSelect,
    MultiSelectGroup,
    MultiSelectOption,
} from "@/components/multi-select"
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
import { Label } from "@/components/ui/label"
import { PolicyDto } from "@/dtos"
import { getBaseUrl } from "@/lib/api"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useEffect, useState } from "react"
import { toast } from "sonner"

interface ManagePermissionsDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    policy: PolicyDto
    options: MultiSelectOption[] | MultiSelectGroup[]
    selectedValues: string[]
}

const BASE_URL = getBaseUrl()

export function ManagePermissionsDialog({
    isOpen,
    setIsOpen,
    options,
    selectedValues: initialSelectedValues,
    policy,
}: Readonly<ManagePermissionsDialogProps>) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedValues, setSelectedValues] = useState<string[]>(
        initialSelectedValues
    )
    const router = useRouter()

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedValues(initialSelectedValues)
    }, [initialSelectedValues])

    const handleClose = () => {
        setIsOpen(false)
    }

    useEffect(() => {
        console.log(selectedValues)
    }, [selectedValues])

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(
                `${BASE_URL}/api/policy-permission/policy/${policy.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        permission_ref_names: selectedValues,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            if (response.ok) {
                handleClose()
                toast.success("Policy permissions have been updated")
                setTimeout(() => router.refresh(), 1000)
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to update policy's permissions")
                toast.warning(error.message || "Failed to update policy's permissions")
            } 
        }
        finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>Manage Permissions</DialogTitle>
                        <DialogDescription>
                            Update this policy&apos;s attached permissions.
                            Click save when ready.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="permissions">Permissions</Label>
                            <MultiSelect
                                options={options}
                                onValueChange={setSelectedValues}
                                placeholder="Select permissions..."
                                defaultValue={initialSelectedValues}
                                resetOnDefaultValueChange
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
                            {isLoading ? "Saving policies..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
