"use client"

import {
    ColumnDef,
    type ColumnFiltersState,
    type SortingState,
} from "@tanstack/react-table"
import { MoreHorizontalIcon } from "lucide-react"

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
import { RoleScopeType } from "@/constants/enums"
import { RoleDto } from "@/dtos"
import { useDebounce } from "@/hooks/use-debounce"
import { useDeleteRole } from "@/hooks/use-delete-role"
import useRoleFormDialog from "@/hooks/use-role-form-dialog"
import { useRolesQuery } from "@/hooks/use-roles-query"
import formatDate from "@/lib/format-date"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import React, { useMemo } from "react"

const FACETED_FILTERS: FacetedFilterConfig[] = [
    {
        column: "scope",
        title: "Scope",
        options: Object.values(RoleScopeType).map((value) => ({
            label: value,
            value,
        })),
    },
]

function getColumns(
    onEdit: (role: RoleDto) => void,
    onDelete: (role: RoleDto) => void
): ColumnDef<RoleDto>[] {
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
            accessorKey: "scope",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Scope" />
            ),
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("scope")}</div>
            ),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorFn: (row) => row.channel?.ref_name,
            id: "channel_ref_name",
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Channel Ref Name"
                />
            ),
            cell: ({ getValue }) => <div>{(getValue() as string) ?? "-"}</div>,
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
                const role = row.original
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
                                        role.id.toString()
                                    )
                                }
                            >
                                Copy role ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/roles/${role.id}`}>View</Link>
                            </DropdownMenuItem>
                            <Can requiredPermission={["auth:update:role", "auth:admin:role"]}>
                                <DropdownMenuItem onClick={() => onEdit(role)}>
                                    Edit
                                </DropdownMenuItem>
                            </Can>
                            <Can
                                requiredPermission={[
                                    "auth:delete:role",
                                    "auth:admin:role",
                                ]}
                            >
                                <DropdownMenuItem
                                    onClick={() => onDelete(role)}>
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

function AddRoleButton({ onAdd }: Readonly<{ onAdd: () => void }>) {
    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            <span>Add Role</span>
        </Button>
    )
}

export function RolesDataTable() {
    const { deleteRole } = useDeleteRole()
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

    const scopeFilter = React.useMemo(() => {
        const filter = columnFilters.find((f) => f.id === "scope")
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

    const query = useRolesQuery(
        {
            page: pagination.pageIndex + 1,
            size: pagination.pageSize,
            search: debouncedSearch,
            scope: scopeFilter,
            sortField,
            sortDesc,
        },
        { enabled: status === "authenticated" }
    )

    const data = query.data?.rows ?? []
    const isLoading = query.isLoading
    const pageCount = query.data?.totalPages ?? 0

    const roleFormDialog = useRoleFormDialog()

    const handleEdit = useMemo(() => {
        return (role: RoleDto) => {
            roleFormDialog.open.edit(role)
        }
    }, [roleFormDialog])

    const columns = React.useMemo(
        () => getColumns(handleEdit, deleteRole),
        [handleEdit, deleteRole]
    )

    return (
        <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            filterColumn="globalSearch"
            filterPlaceholder="Search roles..."
            facetedFilters={FACETED_FILTERS}
            showColumnToggle
            showPagination
            showPageNumbers
            enableRowSelection
            defaultPageSize={10}
            getRowId={(row) => row.id.toString()}
            toolbarChildren={
                <Can requiredPermission={["auth:add:role", "auth:admin:role"]}>
                    <AddRoleButton
                        onAdd={() => {
                            roleFormDialog.open.create()
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
