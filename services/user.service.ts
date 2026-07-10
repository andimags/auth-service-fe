import { UserDto, CreateUserDto, UpdateUserDto } from "@/dtos"
import http from "./http/fetcher"
import { getAuthServiceBaseUrl } from "@/lib/api"

const AUTH_SERVICE_BASE_URL = getAuthServiceBaseUrl()

type GetUsersParams = {
    /** Raw URL query string (e.g. "?page=1&size=10"), forwarded as-is from the incoming request. */
    queryString: string
    accessToken: string
    apiKey: string
}

export async function getUsers({
    queryString,
    accessToken,
    apiKey,
}: GetUsersParams): Promise<UserDto> {
    return http<UserDto>(`${AUTH_SERVICE_BASE_URL}/api/users/${queryString}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    })
}

type GetUserParams = {
    userId: string
    accessToken: string
    apiKey: string
}

export async function getUser({
    userId,
    accessToken,
    apiKey,
}: GetUserParams): Promise<UserDto> {
    return http<UserDto>(`${AUTH_SERVICE_BASE_URL}/api/users/${userId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    })
}

type AddUserParams = {
    payload: CreateUserDto
    accessToken: string
    apiKey: string
}

export async function addUser({
    payload,
    accessToken,
    apiKey,
}: AddUserParams): Promise<UserDto> {
    return http<UserDto>(`${AUTH_SERVICE_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
}

type UpdateUserParams = {
    userId: string
    payload: UpdateUserDto
    accessToken: string
    apiKey: string
}

export async function updateUser({
    userId,
    payload,
    accessToken,
    apiKey,
}: UpdateUserParams): Promise<UserDto> {
    return http<UserDto>(`${AUTH_SERVICE_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
}

type DeleteUserParams = {
    userId: string
    accessToken: string
    apiKey: string
}

export async function deleteUser({
    userId,
    accessToken,
    apiKey,
}: DeleteUserParams): Promise<UserDto> {
    return http<UserDto>(`${AUTH_SERVICE_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
    })
}
