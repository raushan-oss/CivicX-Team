// API route for Firebase report operations
import { NextResponse } from "next/server"
import { createReport, updateReport, getReports } from "@/lib/firebase-service"

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case "create":
        const reportId = await createReport(data)
        return NextResponse.json({ success: true, reportId })

      case "update":
        await updateReport(data.id, data.updates)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Firebase reports API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {}

    // Extract filters from query parameters
    if (searchParams.get("status")) filters.status = searchParams.get("status")
    if (searchParams.get("type")) filters.type = searchParams.get("type")
    if (searchParams.get("userEmail")) filters.userEmail = searchParams.get("userEmail")
    if (searchParams.get("assignedWorkerId")) filters.assignedWorkerId = searchParams.get("assignedWorkerId")

    const reports = await getReports(filters)
    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Firebase reports GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
