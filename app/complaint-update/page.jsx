"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { updateReport } from "@/lib/firebase-service"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ComplaintUpdatePage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [status, setStatus] = useState("loading") // loading, success, error
    const [message, setMessage] = useState("Updating complaint status...")

    const reportId = searchParams.get("reportId")
    const newStatus = searchParams.get("status")

    useEffect(() => {
        if (!reportId || !newStatus) {
            setStatus("error")
            setMessage("Missing report information.")
            return
        }

        const performUpdate = async () => {
            try {
                await updateReport(reportId, {
                    complaintStatus: newStatus,
                    complaintStatusUpdatedAt: new Date().toISOString()
                })

                // Also manually update localStorage just in case updateReport fails to sync across tabs immediately for demo
                const updateLocalData = (key) => {
                    const data = JSON.parse(localStorage.getItem(key) || "[]")
                    const updatedData = data.map(r =>
                        r.id === reportId ? { ...r, complaintStatus: newStatus } : r
                    )
                    localStorage.setItem(key, JSON.stringify(updatedData))
                }

                updateLocalData("userReports")
                updateLocalData("allReports")

                setStatus("success")
                setMessage(`Complaint status updated to "${newStatus}" successfully.`)
            } catch (error) {
                console.error("Update failed:", error)
                setStatus("error")
                setMessage("Failed to update complaint status. Please try again.")
            }
        }

        performUpdate()
    }, [reportId, newStatus])

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 max-w-md w-full text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                        <p className="text-white text-lg">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                        <h2 className="text-xl font-bold text-white">Success!</h2>
                        <p className="text-slate-300">{message}</p>
                        <Link href="/dashboard/user">
                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <h2 className="text-xl font-bold text-white">Error</h2>
                        <p className="text-slate-300">{message}</p>
                        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
                            Go Home
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
