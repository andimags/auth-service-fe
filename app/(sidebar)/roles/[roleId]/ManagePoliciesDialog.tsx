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
import { RoleDto } from "@/dtos/RoleDto"
import { getBaseUrl } from "@/lib/api"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useEffect, useState } from "react"
import { toast } from "sonner"

interface ManagePoliciesDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    role: RoleDto
    options: MultiSelectOption[] | MultiSelectGroup[]
    selectedValues: string[]
}

const BASE_URL = getBaseUrl()

export function ManagePoliciesDialog({
    isOpen,
    setIsOpen,
    options,
    selectedValues: initialSelectedValues,
    role,
}: Readonly<ManagePoliciesDialogProps>) {
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

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(
                `${BASE_URL}/api/role-policy/role/${role.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({ policy_ref_names: selectedValues }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            if (response.ok) {
                toast.success("Role policies have been updated")
                handleClose()
                setTimeout(() => router.refresh(), 1000)
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to update role policies")
                toast.warning(error.message || "Failed to update role policies")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>Manage Policies</DialogTitle>
                        <DialogDescription>
                            Update this role&apos;s attached policies. Click
                            save when ready.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="policies">Policies</Label>
                            <MultiSelect
                                options={options}
                                onValueChange={setSelectedValues}
                                placeholder="Select policies..."
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
