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
import { UserDto } from "@/dtos/UserDto"
import { getBaseUrl } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import * as React from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManageRolesDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    user: UserDto
    options: MultiSelectOption[] | MultiSelectGroup[]
    selectedValues: string[]
    /** Called after a successful update so the parent can refresh its data. */
    onUpdateSuccess?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = getBaseUrl()

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManageRolesDialog({
    isOpen,
    setIsOpen,
    options,
    selectedValues: initialSelectedValues,
    user,
}: Readonly<ManageRolesDialogProps>) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedValues, setSelectedValues] = useState<string[]>(
        initialSelectedValues
    )

    const handleClose = () => {
        setIsOpen(false)
    }

    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(
                `${BASE_URL}/api/user-role/user/${user.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        role_ref_names: selectedValues,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            if (response.ok) {
                toast.success("User's roles have been updated")
                setTimeout(() => router.refresh(), 1000)
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to update user's roles")
                toast.warning(error.message || "Failed to update user's roles")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        } finally {
            setIsLoading(false)
            handleClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>Manage Roles</DialogTitle>
                        <DialogDescription>
                            {
                                "Make changes to the user's roles here. Click save when you're done."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="status">Roles</Label>
                            <MultiSelect
                                options={options}
                                onValueChange={setSelectedValues}
                                placeholder="Select roles ..."
                                defaultValue={initialSelectedValues}
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
                            {isLoading ? "Saving roles ..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
