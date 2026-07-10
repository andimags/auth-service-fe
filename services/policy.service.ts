import { CreatePolicyDto, PolicyDto, UpdatePolicyDto } from "@/dtos"
import { getAuthServiceBaseUrl } from "@/lib/api"
import http from "./http/fetcher"

const AUTH_SERVICE_BASE_URL = getAuthServiceBaseUrl()

type GetPoliciesParams = {
    search?: string
    accessToken: string
    apiKey: string
}

export async function getPolicies({
    search = "",
    accessToken,
    apiKey,
}: GetPoliciesParams): Promise<PolicyDto[]> {
    return http<PolicyDto[]>(`${AUTH_SERVICE_BASE_URL}/api/policies${search}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    })
}

type GetPolicyParams = {
    policyId: string
    accessToken: string
    apiKey: string
}

export async function getPolicy({
    policyId,
    accessToken,
    apiKey,
}: GetPolicyParams): Promise<PolicyDto> {
    return http<PolicyDto>(
        `${AUTH_SERVICE_BASE_URL}/api/policies/${policyId}`,
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

type AddPolicyParams = {
    payload: CreatePolicyDto
    accessToken: string
    apiKey: string
}

export async function addPolicy({
    payload,
    accessToken,
    apiKey,
}: AddPolicyParams): Promise<PolicyDto> {
    return http<PolicyDto>(`${AUTH_SERVICE_BASE_URL}/api/policies`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
}

type UpdatePolicyParams = {
    policyId: string
    payload: UpdatePolicyDto
    accessToken: string
    apiKey: string
}

export async function updatePolicy({
    policyId,
    payload,
    accessToken,
    apiKey,
}: UpdatePolicyParams): Promise<PolicyDto> {
    return http<PolicyDto>(
        `${AUTH_SERVICE_BASE_URL}/api/policies/${policyId}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    )
}

type DeletePolicyParams = {
    policyId: string
    accessToken: string
    apiKey: string
}

export async function deletePolicy({
    policyId,
    accessToken,
    apiKey,
}: DeletePolicyParams): Promise<{ message: string }> {
    return http<{ message: string }>(
        `${AUTH_SERVICE_BASE_URL}/api/policies/${policyId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": apiKey,
                "Content-Type": "application/json",
            },
        }
    )
}
