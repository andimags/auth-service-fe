import { AuthResponseDto, DestroyTokenResponseDto } from "@/dtos/AuthDto"
import http from "./http/fetcher"
import { getAuthServiceBaseUrl } from "@/lib/api"

type LoginParams = {
    email: string
    password: string
    apiKey: string
}

const AUTH_SERVICE_BASE_URL = getAuthServiceBaseUrl()

export async function loginWithCredentials({
    email,
    password,
    apiKey,
}: LoginParams): Promise<AuthResponseDto> {
    return http<AuthResponseDto>(
        `${AUTH_SERVICE_BASE_URL}/api/auth/generate-token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({ email, password }),
        }
    )
}

export async function refreshAccessToken(
    refreshToken: string,
    apiKey: string
): Promise<AuthResponseDto> {
    return http<AuthResponseDto>(
        `${AUTH_SERVICE_BASE_URL}/api/auth/refresh-token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        }
    )
}

export async function destroyToken(
    refreshToken: string,
    apiKey: string
): Promise<DestroyTokenResponseDto> {
    return http<DestroyTokenResponseDto>(
        `${AUTH_SERVICE_BASE_URL}/api/auth/destroy-token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        }
    )
}

