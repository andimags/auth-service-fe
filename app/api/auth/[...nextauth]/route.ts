import { authOptions } from "@/lib/next-auth"
import NextAuth from "next-auth/next"
import { NextRequest } from "next/server"

const internalHandler = NextAuth(authOptions)

interface RouteContext {
    params: Promise<{ nextauth: string[] }>
}

const handler = async (req: NextRequest, context: RouteContext) => {
    const params = await context.params
    return await internalHandler(req, { params })
}

export { handler as GET, handler as POST }
