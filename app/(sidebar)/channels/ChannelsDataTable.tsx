"use client"

import {
    ColumnDef,
    type ColumnFiltersState,
    type SortingState,
} from "@tanstack/react-table"
import { CopyIcon, MoreHorizontalIcon } from "lucide-react"

import { Can } from "@/components/shared/Can"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DataTable,
    DataTableColumnHeader,
    FacetedFilterConfig,
} from "@/components/ui/data-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChannelDto } from "@/dtos"
import useChannelFormDialog from "@/hooks/use-channel-form-dialog"
import { useChannelsQuery } from "@/hooks/use-channels-query"
import { useDebounce } from "@/hooks/use-debounce"
import { useDeleteChannel } from "@/hooks/use-delete-channel"
import formatDate from "@/lib/format-date"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import React, { useMemo } from "react"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Faceted filter config (stable reference — defined outside component)
// ---------------------------------------------------------------------------

const FACETED_FILTERS: FacetedFilterConfig[] = []

// ---------------------------------------------------------------------------
// Column definitions (factory — receives callbacks and pagination state)
// ---------------------------------------------------------------------------

function getColumns(
    onEdit: (channel: ChannelDto) => void,
    onDelete: (channel: ChannelDto) => void
): ColumnDef<ChannelDto>[] {
    return [
        {
            id: "globalSearch",
            header: () => null,
            cell: () => null,
            filterFn: () => true,
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "rowNumber",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="#" />
            ),
            cell: ({ row, table }) => (
                <div className="w-20 font-medium">
                    {(table
                        .getSortedRowModel()
                        ?.flatRows?.findIndex(
                            (flatRow) => flatRow.id === row.id
                        ) || 0) + 1}
                </div>
            ),
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <span className="max-w-125 truncate font-medium">
                        {row.getValue("name")}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => (
                <div className="max-w-200 truncate">
                    {row.getValue("description") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "ref_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Reference Name" />
            ),
            cell: ({ row }) => (
                <div className="font-mono text-sm">
                    {row.getValue("ref_name")}
                </div>
            ),
        },
        {
            accessorKey: "api_key",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="API Key" />
            ),
            cell: ({ row }) => {
                const channel = row.original
                return (
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
                )
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created At" />
            ),
            cell: ({ row }) => (
                <div className="capitalize">
                    {formatDate(row.getValue("created_at") as string)}
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const channel = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontalIcon className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        channel.id.toString()
                                    )
                                }
                            >
                                Copy channel ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/channels/${channel.id}`}>
                                    View
                                </Link>
                            </DropdownMenuItem>
                            <Can
                                requiredPermission={[
                                    "auth:update:channel",
                                    "auth:admin:channel",
                                ]}
                            >
                                <DropdownMenuItem
                                    onClick={() => onEdit(channel)}
                                >
                                    Edit
                                </DropdownMenuItem>
                            </Can>
                            <Can
                                requiredPermission={[
                                    "auth:delete:channel",
                                    "auth:admin:channel",
                                ]}
                            >
                                <DropdownMenuItem
                                    onClick={() => onDelete(channel)}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </Can>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}

// ---------------------------------------------------------------------------
// Toolbar add-button (stable component — defined outside parent)
// ---------------------------------------------------------------------------

function AddChannelButton({ onAdd }: Readonly<{ onAdd: () => void }>) {
    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            <span>Add Channel</span>
        </Button>
    )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChannelsDataTable() {
    // Shared delete hook — no more duplicated fetch + confirm + toast logic.
    const { deleteChannel } = useDeleteChannel()

    const { status } = useSession()

    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "created_at", desc: true },
    ])
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])

    const search = React.useMemo(() => {
        const filter = columnFilters.find((f) => f.id === "globalSearch")
        return filter?.value ? String(filter.value) : undefined
    }, [columnFilters])

    const debouncedSearch = useDebounce(search, 1000)

    const sortField = React.useMemo(
        () => (sorting.length > 0 ? String(sorting[0].id) : undefined),
        [sorting]
    )

    const sortDesc = React.useMemo(
        () => sorting.length > 0 && sorting[0].desc,
        [sorting]
    )

    const query = useChannelsQuery(
        {
            page: pagination.pageIndex + 1,
            size: pagination.pageSize,
            search: debouncedSearch,
            sortField,
            sortDesc,
        },
        { enabled: status === "authenticated" }
    )

    const data = query.data?.rows ?? []
    const isLoading = query.isLoading
    const pageCount = query.data?.totalPages ?? 0

    const channelFormDialog = useChannelFormDialog()

    const handleEdit = useMemo(() => {
        return (channel: ChannelDto) => {
            channelFormDialog.open.edit(channel)
        }
    }, [channelFormDialog])

    const columns = React.useMemo(
        () => getColumns(handleEdit, deleteChannel),
        [handleEdit, deleteChannel]
    )

    return (
        <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            filterColumn="globalSearch"
            filterPlaceholder="Search channels..."
            facetedFilters={FACETED_FILTERS}
            showColumnToggle
            showPagination
            showPageNumbers
            enableRowSelection
            defaultPageSize={10}
            getRowId={(row) => row.id.toString()}
            toolbarChildren={
                <Can requiredPermission={["auth:add:channel", "auth:admin:channel"]}>
                    <AddChannelButton
                        onAdd={() => {
                            channelFormDialog.open.create()
                        }}
                    />
                </Can>
            }
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            manualPagination
            pageCount={pageCount}
        />
    )
}
