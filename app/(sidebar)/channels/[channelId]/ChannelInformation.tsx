"use client"

import { Can } from "@/components/shared/Can"
import { Button } from "@/components/ui/button"
import { NAVIGATE_AWAY_DELAY_MS, REFRESH_DELAY_MS } from "@/constants/ui"
import { ChannelDto } from "@/dtos"
import useChannelFormDialog from "@/hooks/use-channel-form-dialog"
import { useDeleteChannel } from "@/hooks/use-delete-channel"
import formatDate from "@/lib/format-date"
import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { CopyIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ChannelInformationProps {
    channel: ChannelDto
}

export default function ChannelInformation({
    channel,
}: Readonly<ChannelInformationProps>) {
    const channelFormDialog = useChannelFormDialog()
    const router = useRouter()
    const { deleteChannel } = useDeleteChannel({
        onSuccess: () => {
            setTimeout(() => router.push("/channels"), NAVIGATE_AWAY_DELAY_MS)
        },
    })

    const handleEditChannel = () => {
        channelFormDialog.open.edit(channel, () => {
            channelFormDialog.close()
            setTimeout(() => router.refresh(), REFRESH_DELAY_MS)
        })
    }

    return (
        <div className="mx-auto w-full max-w-6xl text-neutral-900 transition-colors duration-200 dark:text-neutral-100">
            <div className="flex items-start justify-between pb-6">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                        Channel Information
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Channel details and properties.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Can requiredPermission={['auth:admin:channel', 'auth:update:channel']}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditChannel}
                        >
                            <HugeiconsIcon
                                icon={PencilEdit01Icon}
                                strokeWidth={2}
                            />
                            <span>Edit Channel</span>
                        </Button>
                    </Can>
                    <Can requiredPermission={['auth:admin:channel', 'auth:delete:channel']}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteChannel(channel)}
                        >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                            <span>Delete</span>
                        </Button>
                    </Can>
                </div>
            </div>

            <dl className="text-sm">
                <InfoRow label="ID">{channel.id}</InfoRow>
                <InfoRow label="Name">{channel.name}</InfoRow>
                <InfoRow label="Reference Name">{channel.ref_name}</InfoRow>
                <InfoRow label="API Key">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            navigator.clipboard.writeText(channel.api_key)
                            toast.success("API key copied to clipboard")
                        }}
                    >
                        <CopyIcon className="size-4" />
                    </Button>
                </InfoRow>
                <InfoRow label="Description">
                    {channel.description ?? "-"}
                </InfoRow>
                <InfoRow label="Created">
                    {formatDate(channel.created_at)}
                </InfoRow>
                <InfoRow label="Last Updated">
                    {formatDate(channel.updated_at)}
                </InfoRow>
            </dl>
        </div>
    )
}

function InfoRow({
    label,
    children,
}: Readonly<{
    label: string
    children: React.ReactNode
}>) {
    return (
        <div className="grid grid-cols-3 border-t border-neutral-200 py-5 dark:border-neutral-800">
            <dt className="font-semibold text-neutral-900 dark:text-neutral-200">
                {label}
            </dt>
            <dd className="col-span-2 text-neutral-600 dark:text-neutral-400">
                {children}
            </dd>
        </div>
    )
}
