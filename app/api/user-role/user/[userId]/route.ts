import { ReplaceUserRolesDto } from "@/dtos/UserRoleDto"
import { ApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/next-auth"
import { replaceUserRoles } from "@/services/user-role.service"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

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

        const payload: ReplaceUserRolesDto = await request.json()

        const response = await replaceUserRoles({
            userId,
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
