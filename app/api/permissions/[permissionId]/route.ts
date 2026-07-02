import { UpdatePermissionDto } from "@/dtos/PermissionDto"
import { ApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/next-auth"
import {
    deletePermission,
    getPermission,
    updatePermission,
} from "@/services/permission.service"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ permissionId: string }> }
) {
    try {
        const { permissionId } = await params
        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const response = await getPermission({
            permissionId,
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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ permissionId: string }> }
) {
    try {
        const { permissionId } = await params

        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken || !permissionId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const payload: UpdatePermissionDto = await request.json()

        const response = await updatePermission({
            permissionId,
            payload,
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
    { params }: { params: Promise<{ permissionId: string }> }
) {
    try {
        const { permissionId } = await params

        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken || !permissionId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const response = await deletePermission({
            permissionId,
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
