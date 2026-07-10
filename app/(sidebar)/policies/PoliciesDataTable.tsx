"use client"

import {
    ColumnDef,
    type ColumnFiltersState,
    type SortingState,
} from "@tanstack/react-table"

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
import { PolicyIsSystemType } from "@/constants/enums"
import { PolicyDto } from "@/dtos"
import { useDebounce } from "@/hooks/use-debounce"
import { useDeletePolicy } from "@/hooks/use-delete-policy"
import { usePoliciesQuery } from "@/hooks/use-policies-query"
import usePolicyFormDialog from "@/hooks/use-policy-form-dialog"
import formatDate from "@/lib/format-date"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckCircle2Icon, MoreHorizontalIcon, XCircleIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import React, { useMemo } from "react"

const FACETED_FILTERS: FacetedFilterConfig[] = [
    {
        column: "is_system",
        title: "Is System",
        options: Object.values(PolicyIsSystemType).map((value) => ({
            label: value,
            value,
        })),
    },
]

const IS_SYSTEM_ICONS: Record<PolicyDto["is_system"], React.ElementType> = {
    true: CheckCircle2Icon,
    false: XCircleIcon,
}

function getColumns(
    onEdit: (policy: PolicyDto) => void,
    onDelete: (policy: PolicyDto) => void
): ColumnDef<PolicyDto>[] {
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
                <div className="flex space-x-2">
                    <span className="max-w-125 truncate font-medium">
                        {row.getValue("description")}
                    </span>
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
            accessorKey: "is_system",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Is System" />
            ),
            cell: ({ row }) => {
                const is_system = row.getValue(
                    "is_system"
                ) as PolicyDto["is_system"]
                const Icon = IS_SYSTEM_ICONS[is_system]
                return (
                    <div className="flex w-25 items-center">
                        <Icon className="mr-2 size-4 text-muted-foreground" />
                        {/* <span className="capitalize">
                                    is_system
                                </span> */}
                    </div>
                )
            },
            filterFn: (row, id, value) =>
                value.includes(String(row.getValue(id))),
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
                const policy = row.original
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
                                        policy.id.toString()
                                    )
                                }
                            >
                                Copy policy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/policies/${policy.id}`}>
                                    View
                                </Link>
                            </DropdownMenuItem>
                            <Can requiredPermission={["auth:update:policy", "auth:admin:policy"]}>
                                <DropdownMenuItem onClick={() => onEdit(policy)}>
                                    Edit
                                </DropdownMenuItem>
                            </Can>
                            <Can
                                requiredPermission={[
                                    "auth:delete:policy",
                                    "auth:admin:policy",
                                ]}
                            >
                                <DropdownMenuItem
                                    onClick={() => onDelete(policy)}
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

function AddPolicyButton({ onAdd }: Readonly<{ onAdd: () => void }>) {
    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            <span>Add Policy</span>
        </Button>
    )
}

export function PoliciesDataTable() {
    const { deletePolicy } = useDeletePolicy()
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

        if (!filter?.value) {
            return undefined
        }

        const filterValue = filter.value

        if (Array.isArray(filterValue)) {
            return filterValue.join(",")
        }

        if (typeof filterValue === "object") {
            return JSON.stringify(filterValue)
        }

        return String(filterValue)
    }, [columnFilters])

    const debouncedSearch = useDebounce(search, 1000)

    const isSystemFilter = React.useMemo(() => {
        const filter = columnFilters.find((f) => f.id === "is_system")
        return filter && Array.isArray(filter.value)
            ? filter.value.join(",")
            : undefined
    }, [columnFilters])

    const sortField = React.useMemo(
        () => (sorting.length > 0 ? String(sorting[0].id) : undefined),
        [sorting]
    )

    const sortDesc = React.useMemo(
        () => sorting.length > 0 && sorting[0].desc,
        [sorting]
    )

    const query = usePoliciesQuery(
        {
            page: pagination.pageIndex + 1,
            size: pagination.pageSize,
            search: debouncedSearch,
            isSystem: isSystemFilter,
            sortField,
            sortDesc,
        },
        { enabled: status === "authenticated" }
    )

    const data = query.data?.rows ?? []
    const isLoading = query.isLoading
    const pageCount = query.data?.totalPages ?? 0

    const policyFormDialog = usePolicyFormDialog()

    const handleEdit = useMemo(() => {
        return (policy: PolicyDto) => {
            policyFormDialog.open.edit(policy)
        }
    }, [policyFormDialog])

    const columns = React.useMemo(
        () => getColumns(handleEdit, deletePolicy),
        [handleEdit, deletePolicy]
    )

    return (
        <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            filterColumn="globalSearch"
            filterPlaceholder="Search policies..."
            facetedFilters={FACETED_FILTERS}
            showColumnToggle
            showPagination
            showPageNumbers
            enableRowSelection
            defaultPageSize={10}
            getRowId={(row) => row.id.toString()}
            toolbarChildren={
                <Can requiredPermission={["auth:add:policy", "auth:admin:policy"]}>
                    <AddPolicyButton
                        onAdd={() => {
                            policyFormDialog.open.create()
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
