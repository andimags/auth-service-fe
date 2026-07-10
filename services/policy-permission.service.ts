import {
    ReplacePolicyPermissionsDto,
    PolicyPermissionDto,
} from "@/dtos/PolicyPermissionDto"
import { getAuthServiceBaseUrl } from "@/lib/api"
import http from "./http/fetcher"

const AUTH_SERVICE_BASE_URL = getAuthServiceBaseUrl()

type GetPolicyPermissionsParams = {
    policyId: number | string
    accessToken: string
    apiKey: string
}

export async function getPolicyPermissions({
    policyId,
    accessToken,
    apiKey,
}: GetPolicyPermissionsParams): Promise<PolicyPermissionDto[]> {
    return http<PolicyPermissionDto[]>(
        `${AUTH_SERVICE_BASE_URL}/api/policy-permission/policy/${policyId.toString()}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": apiKey,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        }
    )
}

type ReplacePolicyPermissionsParams = {
    policyId: number | string
    payload: ReplacePolicyPermissionsDto
    accessToken: string
    apiKey: string
}

export async function replacePolicyPermissions({
    policyId,
    payload,
    accessToken,
    apiKey,
}: ReplacePolicyPermissionsParams): Promise<PolicyPermissionDto[]> {
    return http<PolicyPermissionDto[]>(
        `${AUTH_SERVICE_BASE_URL}/api/policy-permission/policy/${policyId.toString()}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": apiKey,
                "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify(payload),
        }
    )
}
