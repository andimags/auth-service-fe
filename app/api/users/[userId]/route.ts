import { UpdateUserDto } from "@/dtos/UserDto"
import { getBaseUrl } from "@/lib/api"
import { ApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/next-auth"
import { deleteUser, updateUser } from "@/services/user.service"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

const BASE_URL = getBaseUrl()

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params

        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const res = await fetch(`${BASE_URL}/backend/users/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": apiKey,
            },
            cache: "no-store",
        })

        if (!res.ok) {
            return NextResponse.json(
                { message: "Failed to fetch user data" },
                { status: res.status }
            )
        }

        const user = await res.json()

        return NextResponse.json(user)
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                {
                    message: error.message,
                    ...(error.details !== undefined && { details: error.details }),
                },
                { status: error.statusCode }
            )
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key
        const userId = (await params).userId

        if (!session?.user?.email || !apiKey || !accessToken || !userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const payload: UpdateUserDto = await request.json()

        const response = await updateUser({
            payload,
            userId,
            accessToken,
            apiKey,
        })

        return NextResponse.json(response)
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                {
                    message: error.message,
                    ...(error.details !== undefined && { details: error.details }),
                },
                { status: error.statusCode }
            )
        }

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key
        const userId = (await params).userId

        if (!session?.user?.email || !apiKey || !accessToken || !userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const response = await deleteUser({
            userId,
            accessToken,
            apiKey,
        })

        return NextResponse.json(response)
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                {
                    message: error.message,
                    ...(error.details !== undefined && { details: error.details }),
                },
                { status: error.statusCode }
            )
        }

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        )
    }
}
