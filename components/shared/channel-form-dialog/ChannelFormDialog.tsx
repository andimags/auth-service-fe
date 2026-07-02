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
import { Textarea } from "@/components/ui/textarea"
import { ChannelDto } from "@/dtos/ChannelDto"
import { getBaseUrl } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useChannelFormStore } from "./channel-form-store"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelDialogType = {
    open: boolean
    mode: "create" | "edit"
    channel: ChannelDto | undefined
}

interface ChannelFormDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    mode: "create" | "edit"
    channel?: ChannelDto
    /** Called after a successful update so the parent can refresh its data. */
    onUpdateSuccess?: () => void
}

interface ChannelFormState {
    name: string
    description: string
    ref_name: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_FORM_STATE: ChannelFormState = {
    name: "",
    description: "",
    ref_name: "",
}

const BASE_URL = getBaseUrl()

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChannelFormDialog() {
    const [payload, setPayload] = useState<ChannelFormState>(INITIAL_FORM_STATE)

    const { isOpen, setIsOpen, mode, channel, onUpdateSuccess } =
        useChannelFormStore()

    useEffect(() => {
        if (!isOpen) return

        if (mode === "edit" && channel) {
            setPayload((prev) => ({
                ...prev,
                name: channel.name ?? "",
                description: channel.description ?? "",
                ref_name: channel.ref_name ?? "",
            }))
        } else {
            setPayload(INITIAL_FORM_STATE)
        }
    }, [isOpen, mode, channel])

    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    // Generic field updater — avoids a separate handler per field.
    const handleChange =
        (field: keyof ChannelFormState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setPayload((prev) => ({ ...prev, [field]: e.target.value }))

    const handleClose = () => {
        setPayload(INITIAL_FORM_STATE)
        setIsOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (mode === "create") {
                await createChannel()
            } else {
                await updateChannel()
            }
        } finally {
            setIsLoading(false)
        }
    }

    const createChannel = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/channels`, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                handleClose()
                toast.success("Channel has been created")
                queryClient.invalidateQueries({ queryKey: ["channels"] })
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to create channel")
                toast.warning(error.message || "Failed to create channel")
            }
        } catch (error) {
            console.warn(error)
            toast.error("Network error. Please try again.")
        }
    }

    const updateChannel = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}/api/channels/${channel?.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" },
                }
            )

            if (response.ok) {
                handleClose()
                toast.success("Channel has been updated")
                queryClient.invalidateQueries({ queryKey: ["channels"] })
                onUpdateSuccess?.()
            } else {
                const error = await response.json()
                console.warn(error.message || "Failed to update channel")
                toast.warning(error.message || "Failed to update channel")
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
                            {isCreate ? "Create Channel" : "Edit Channel"}
                        </DialogTitle>
                        <DialogDescription>
                            {isCreate
                                ? "Fill in the details to create a new channel."
                                : "Make changes to the channel's information here. Click save when you're done."}
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="name">Channel Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="My Channel"
                                value={payload.name}
                                onChange={handleChange("name")}
                                required
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Channel description"
                                value={payload.description}
                                onChange={handleChange("description")}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor="ref_name">Reference Name</Label>
                            <Input
                                id="ref_name"
                                name="ref_name"
                                placeholder="my_channel"
                                value={payload.ref_name}
                                onChange={handleChange("ref_name")}
                                required
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
                            {isLoading
                                ? isCreate
                                    ? "Creating channel..."
                                    : "Updating channel..."
                                : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
