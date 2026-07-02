import { UpdateChannelDto } from "@/dtos"
import { ApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/next-auth"
import {
    deleteChannel,
    getChannel,
    updateChannel,
} from "@/services/channel.service"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { channelId } = await params

        const response = await getChannel({
            channelId,
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
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { channelId } = await params
        const payload: UpdateChannelDto = await request.json()

        const response = await updateChannel({
            channelId,
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
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const accessToken = session?.access_token
        const apiKey = session?.api_key

        if (!session?.user?.email || !apiKey || !accessToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { channelId } = await params

        const response = await deleteChannel({
            channelId,
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
