import { UpdateRoleDto } from "@/dtos/RoleDto"
import { ApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/next-auth"
import { deleteRole, getRole, updateRole } from "@/services/role.service"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params

        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const response = await getRole({
            roleId,
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
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params

        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken || !roleId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const payload: UpdateRoleDto = await request.json()

        const response = await updateRole({
            roleId,
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
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params

        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken || !roleId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const response = await deleteRole({
            roleId,
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
