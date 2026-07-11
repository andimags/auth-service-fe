import * as React from "react"

export type ScreenSize = "mobile" | "tablet" | "desktop"

interface BreakpointConfig {
    maxCount?: number
    hideIcons?: boolean
    compactMode?: boolean
}

/**
 * Responsive configuration for different screen sizes. Can be boolean true
 * for default responsive behavior or an object for custom configuration.
 */
export type ResponsiveConfig =
    | boolean
    | {
          /** Configuration for mobile devices (< 640px) */
          mobile?: BreakpointConfig
          /** Configuration for tablet devices (640px - 1024px) */
          tablet?: BreakpointConfig
          /** Configuration for desktop devices (> 1024px) */
          desktop?: BreakpointConfig
      }

export interface ResponsiveSettings {
    maxCount: number
    hideIcons: boolean
    compactMode: boolean
}

export interface WidthConstraints {
    minWidth: string
    maxWidth: string
    width: string
}

/** Tracks viewport width and buckets it into mobile (<640px) / tablet (<1024px) / desktop breakpoints. */
export function useScreenSize(): ScreenSize {
    const [screenSize, setScreenSize] = React.useState<ScreenSize>("desktop")

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const handleResize = () => {
            const width = window.innerWidth
            if (width < 640) {
                setScreenSize("mobile")
            } else if (width < 1024) {
                setScreenSize("tablet")
            } else {
                setScreenSize("desktop")
            }
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", handleResize)
            }
        }
    }, [])

    return screenSize
}

const DEFAULT_RESPONSIVE_BREAKPOINTS: Record<ScreenSize, Required<BreakpointConfig>> = {
    mobile: { maxCount: 2, hideIcons: false, compactMode: true },
    tablet: { maxCount: 4, hideIcons: false, compactMode: false },
    desktop: { maxCount: 6, hideIcons: false, compactMode: false },
}

export function getResponsiveSettings(
    responsive: ResponsiveConfig | undefined,
    screenSize: ScreenSize,
    maxCount: number
): ResponsiveSettings {
    if (!responsive) {
        return { maxCount, hideIcons: false, compactMode: false }
    }

    const currentSettings =
        responsive === true
            ? DEFAULT_RESPONSIVE_BREAKPOINTS[screenSize]
            : responsive[screenSize]

    return {
        maxCount: currentSettings?.maxCount ?? maxCount,
        hideIcons: currentSettings?.hideIcons ?? false,
        compactMode: currentSettings?.compactMode ?? false,
    }
}

export function getWidthConstraints(
    screenSize: ScreenSize,
    minWidth: string | undefined,
    maxWidth: string | undefined,
    autoSize: boolean
): WidthConstraints {
    const defaultMinWidth = screenSize === "mobile" ? "0px" : "200px"
    return {
        minWidth: minWidth || defaultMinWidth,
        maxWidth: maxWidth || "100%",
        width: autoSize ? "auto" : "100%",
    }
}
