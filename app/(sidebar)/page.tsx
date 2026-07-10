import { ProtectedRoute } from "@/components/shared/ProtectedRoute"

export default function Page() {
    return (
        <ProtectedRoute>
            <div className="flex min-h-svh p-6">
                <h1 className="font-medium">Dashboard</h1>
            </div>
        </ProtectedRoute>
    )
}
