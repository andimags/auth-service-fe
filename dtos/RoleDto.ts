import { RoleScopeType } from "@/constants/enums"
import { ChannelDto } from "./ChannelDto"

export interface RoleDto {
    id: number
    name: string
    description?: string | null
    ref_name: string
    channel_id: number | null
    scope: RoleScopeType
    created_at: Date
    updated_at: Date
    deleted_at?: Date | null
    channel?: ChannelDto
}

export interface CreateRoleDto {
    name: string
    description?: string | null
    ref_name: string
    channel_id?: number | null
    scope: RoleScopeType
}

export interface UpdateRoleDto {
    name?: string
    description?: string | null
    ref_name?: string
    channel_id?: number | null
    scope?: RoleScopeType
}
