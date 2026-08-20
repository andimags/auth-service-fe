"use client"

import { isUnrecoverableAuthError } from "@/lib/auth/errors"
import {
    SessionProvider as NextAuthSessionProvider,
    signOut,
    useSession,
} from "next-auth/react"
import { useEffect } from "react"

function SessionWatcher() {
    const { data: session } = useSession()

    useEffect(() => {
        // Sign out on any unrecoverable auth error the refresh flow can emit; the
        // set of codes is defined alongside the refresh logic so the two can't
        // drift out of sync.
        if (isUnrecoverableAuthError(session?.error)) signOut()
    }, [session?.error])

    return null
}

export function SessionProvider({
    children,
}: Readonly<React.PropsWithChildren>) {
    return (
        <NextAuthSessionProvider
            refetchInterval={30}
            refetchOnWindowFocus={true}
        >
            <SessionWatcher />
            {children}
        </NextAuthSessionProvider>
    )
}
