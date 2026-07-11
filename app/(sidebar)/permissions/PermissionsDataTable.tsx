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
import {
    PermissionAccessLevelType,
    PermissionIsSystemType,
} from "@/constants/enums"
import { PermissionDto } from "@/dtos"
import { useDebounce } from "@/hooks/use-debounce"
import { useDeletePermission } from "@/hooks/use-delete-permission"
import usePermissionFormDialog from "@/hooks/use-permission-form-dialog"
import { usePermissionsQuery } from "@/hooks/use-permissions-query"
import formatDate from "@/lib/format-date"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckCircle2Icon, MoreHorizontalIcon, XCircleIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import React, { useMemo } from "react"

const FACETED_FILTERS: FacetedFilterConfig[] = [
    {
        column: "access_level",
        title: "Access Level",
        options: Object.values(PermissionAccessLevelType).map((value) => ({
            label: value.charAt(0).toUpperCase() + value.slice(1),
            value,
        })),
    },
    {
        column: "is_system",
        title: "Is System",
        options: Object.values(PermissionIsSystemType).map((value) => ({
            label: value,
            value,
        })),
    },
]

const IS_SYSTEM_ICONS: Record<PermissionDto["is_system"], React.ElementType> = {
    true: CheckCircle2Icon,
    false: XCircleIcon,
}

function getColumns(
    onEdit: (permission: PermissionDto) => void,
    onDelete: (permission: PermissionDto) => void
): ColumnDef<PermissionDto>[] {
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
                        {row.getValue("description") || "-"}
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
            accessorKey: "module",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Module" />
            ),
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("module")}</div>
            ),
        },
        {
            accessorKey: "access_level",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Access Level" />
            ),
            cell: ({ row }) => {
                const accessLevel = row.getValue("access_level") as string
                return <div className="capitalize">{accessLevel}</div>
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: "is_system",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Is System" />
            ),
            cell: ({ row }) => {
                const is_system = row.getValue(
                    "is_system"
                ) as PermissionDto["is_system"]
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
                const permission = row.original
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
                                        permission.id.toString()
                                    )
                                }
                            >
                                Copy permission ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/permissions/${permission.id}`}>
                                    View
                                </Link>
                            </DropdownMenuItem>
                            <Can
                                requiredPermission={[
                                    "auth:update:permission",
                                    "auth:admin:permission",
                                ]}
                            >
                                <DropdownMenuItem
                                    onClick={() => onEdit(permission)}
                                >
                                    Edit
                                </DropdownMenuItem>
                            </Can>
                            <Can
                                requiredPermission={[
                                    "auth:delete:permission",
                                    "auth:admin:permission",
                                ]}
                            >
                                <DropdownMenuItem
                                    onClick={() => onDelete(permission)}
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

function AddPermissionButton({ onAdd }: Readonly<{ onAdd: () => void }>) {
    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            <span>Add Permission</span>
        </Button>
    )
}

export function PermissionsDataTable() {
    const { deletePermission } = useDeletePermission()
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

    const accessLevelFilter = React.useMemo(() => {
        const filter = columnFilters.find((f) => f.id === "access_level")
        return filter && Array.isArray(filter.value)
            ? filter.value.join(",")
            : undefined
    }, [columnFilters])

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

    const query = usePermissionsQuery(
        {
            page: pagination.pageIndex + 1,
            size: pagination.pageSize,
            search: debouncedSearch,
            accessLevel: accessLevelFilter,
            sortField,
            sortDesc,
            isSystem: isSystemFilter,
        },
        { enabled: status === "authenticated" }
    )

    const data = query.data?.rows ?? []
    const isLoading = query.isLoading
    const pageCount = query.data?.totalPages ?? 0

    const permissionFormDialog = usePermissionFormDialog()

    const handleEdit = useMemo(() => {
        return (permission: PermissionDto) => {
            permissionFormDialog.open.edit(permission)
        }
    }, [permissionFormDialog])

    const columns = React.useMemo(
        () => getColumns(handleEdit, deletePermission),
        [handleEdit, deletePermission]
    )

    return (
        <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            filterColumn="globalSearch"
            filterPlaceholder="Search permissions..."
            facetedFilters={FACETED_FILTERS}
            showColumnToggle
            showPagination
            showPageNumbers
            enableRowSelection
            defaultPageSize={10}
            getRowId={(row) => row.id.toString()}
            toolbarChildren={
                <Can
                    requiredPermission={[
                        "auth:add:permission",
                        "auth:admin:permission",
                    ]}
                >
                    <AddPermissionButton
                        onAdd={() => {
                            permissionFormDialog.open.create()
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
