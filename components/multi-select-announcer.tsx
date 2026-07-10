import * as React from "react"
import { ARIA_ANNOUNCEMENT_CLEAR_DELAY_MS } from "@/constants/ui"

/**
 * Manages the polite/assertive ARIA live-region messages used to announce
 * selection changes to screen reader users, and renders the (visually
 * hidden) live regions themselves.
 */
export function useAriaAnnouncer(): {
    announce: (message: string, priority?: "polite" | "assertive") => void
    liveRegion: React.ReactNode
} {
    const [politeMessage, setPoliteMessage] = React.useState("")
    const [assertiveMessage, setAssertiveMessage] = React.useState("")

    const announce = React.useCallback(
        (message: string, priority: "polite" | "assertive" = "polite") => {
            if (priority === "assertive") {
                setAssertiveMessage(message)
                setTimeout(() => setAssertiveMessage(""), ARIA_ANNOUNCEMENT_CLEAR_DELAY_MS)
            } else {
                setPoliteMessage(message)
                setTimeout(() => setPoliteMessage(""), ARIA_ANNOUNCEMENT_CLEAR_DELAY_MS)
            }
        },
        []
    )

    const liveRegion = (
        <div className="sr-only">
            <div aria-live="polite" aria-atomic="true" role="status">
                {politeMessage}
            </div>
            <div aria-live="assertive" aria-atomic="true" role="alert">
                {assertiveMessage}
            </div>
        </div>
    )

    return { announce, liveRegion }
}
