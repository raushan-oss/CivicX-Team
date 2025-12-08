import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { NextResponse } from "next/server"

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("reportId")
    const status = searchParams.get("status")

    if (!reportId || !status) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    try {
        if (!db) {
            return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 })
        }

        const reportRef = doc(db, "reports", reportId)
        await updateDoc(reportRef, {
            complaintStatus: status,
            complaintStatusUpdatedAt: new Date().toISOString(),
        })

        return new NextResponse(
            `<html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: green;">Success</h1>
          <p>Complaint status for Report ID <strong>${reportId}</strong> has been updated to <strong>${status}</strong>.</p>
          <p>You can close this window.</p>
        </body>
      </html>`,
            {
                headers: { "Content-Type": "text/html" },
            }
        )
    } catch (error) {
        console.error("Error updating complaint status:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
