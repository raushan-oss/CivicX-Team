"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"

export function ComplaintModal({ userEmail, report }) {
    const [open, setOpen] = useState(false)
    const [complaint, setComplaint] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!complaint.trim()) {
            toast.error("Please enter your complaint")
            return
        }

        setIsSubmitting(true)

        try {
            // Construct the message with report details if available
            let messageBody = complaint
            if (report) {
                // Use environment variable for public URL if available (useful for cross-device testing via ngrok or production)
                // Otherwise fall back to the current window's origin (localhost)
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

                const processingLink = `${baseUrl}/complaint-update?reportId=${report.id}&status=processing`
                const completeLink = `${baseUrl}/complaint-update?reportId=${report.id}&status=completed`

                messageBody += `\n\n--- Related Report Details ---\nTitle: ${report.title}\nDescription: ${report.description}\nLocation: ${report.location}\nReport ID: ${report.id}`

                // Add HTML buttons for the email
                // Note: We need to send this as 'message' but Web3Forms usually handles text. 
                // To send HTML we might need a specific config or just rely on the links being clickable.
                // We'll append clickable links which is safer for basic text emails.

                messageBody += `\n\n--- Admin Actions ---\n`
                messageBody += `Click here to mark as Processing: ${processingLink}\n\n`
                messageBody += `Click here to mark as Complete: ${completeLink}`
            }

            // Web3Forms submission
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
                    email: userEmail,
                    message: messageBody,
                    subject: report ? `Complaint regarding report: ${report.title}` : `New Complaint from ${userEmail}`,
                    from_name: "CivicX Complaint System",
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to send complaint")
            }

            toast.success("Complaint sent successfully")

            // Persist complaint status locally
            if (report) {
                const updateLocalReports = (key) => {
                    const saved = JSON.parse(localStorage.getItem(key) || "[]")
                    const updated = saved.map(r =>
                        r.id === report.id
                            ? { ...r, complaintSent: true, complaintSentAt: new Date().toISOString() }
                            : r
                    )
                    localStorage.setItem(key, JSON.stringify(updated))
                }

                updateLocalReports("userReports")
                updateLocalReports("allReports")
            }

            setComplaint("")
            setOpen(false)
        } catch (error) {
            console.error("Error sending complaint:", error)
            toast.error("Failed to send complaint. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    File Complaint
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle>File a Complaint</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Describe your issue below. We will review it and get back to you via email.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        id="complaint"
                        placeholder="Type your complaint here..."
                        className="min-h-[150px] bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        value={complaint}
                        onChange={(e) => setComplaint(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            "Sending..."
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Complaint
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
