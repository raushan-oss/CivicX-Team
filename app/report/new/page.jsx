"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, MapPin, Upload, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

export default function NewReport() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    location: "",
    image: null,
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [isValidatingImage, setIsValidatingImage] = useState(false)
  const [imageValidation, setImageValidation] = useState(null)
  const fileInputRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    if (role !== "user") {
      router.push("/")
    }
  }, [router])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageData = e.target.result
      setImagePreview(imageData)
      setFormData((prev) => ({ ...prev, image: imageData }))

      setIsValidatingImage(true)
      setImageValidation(null)

      try {
        const response = await fetch("/api/validate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageData }),
        })

        const validation = await response.json()
        setImageValidation(validation)
      } catch (error) {
        console.error("Validation error:", error)
        setImageValidation({
          isValid: false,
          confidence: 0,
          message: "Failed to validate image. Please try again.",
          suggestions: ["Please try uploading the image again"],
        })
      } finally {
        setIsValidatingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData((prev) => ({
          ...prev,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }))
        setLocationError("")
      },
      (error) => {
        setLocationError("Unable to retrieve location. Please enter manually.")
      },
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.location) {
      alert("Please fill in all required fields")
      return
    }

    if (imageValidation && !imageValidation.isValid) {
      alert("Please upload a valid image showing the civic issue")
      return
    }

    setIsSubmitting(true)

    // Create new report
    const newReport = {
      id: Date.now().toString(),
      ...formData,
      status: "pending",
      createdAt: new Date().toISOString(),
      userEmail: localStorage.getItem("userEmail"),
      aiValidation: imageValidation,
    }

    // Save to localStorage (simulate database)
    const existingReports = JSON.parse(localStorage.getItem("userReports") || "[]")
    const allReports = JSON.parse(localStorage.getItem("allReports") || "[]")

    existingReports.push(newReport)
    allReports.push(newReport)

    localStorage.setItem("userReports", JSON.stringify(existingReports))
    localStorage.setItem("allReports", JSON.stringify(allReports))

    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/dashboard/user")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-300">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard/user"
          className="inline-flex items-center text-primary hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Report Civic Issue</CardTitle>
            <CardDescription>
              Help improve your community by reporting potholes, garbage, and other issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Large pothole on Main Street"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Enter address or coordinates"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    required
                  />
                  <Button type="button" variant="outline" onClick={getCurrentLocation} className="gap-2 bg-red-700">
                    <MapPin className="w-4 h-4 " />
                    Use Current
                  </Button>
                </div>
                {locationError && <p className="text-sm text-destructive">{locationError}</p>}
              </div>

              <div className="space-y-2">
                <Label>Photo Evidence</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      {isValidatingImage && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI is analyzing your image...
                        </div>
                      )}
                      {imageValidation && (
                        <div
                          className={`p-4 rounded-lg border ${
                            imageValidation.isValid
                              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200"
                              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {imageValidation.isValid ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <AlertTriangle className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                              {imageValidation.isValid ? "Valid Civic Issue" : "Invalid Image"}
                              {imageValidation.confidence > 0 && ` (${imageValidation.confidence}% confidence)`}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{imageValidation.message}</p>
                          {imageValidation.issueType && imageValidation.issueType !== "none" && (
                            <p className="text-sm mb-2">
                              <strong>Detected:</strong>{" "}
                              {imageValidation.issueType.charAt(0).toUpperCase() + imageValidation.issueType.slice(1)}
                            </p>
                          )}
                          {imageValidation.suggestions && imageValidation.suggestions.length > 0 && (
                            <div className="text-sm">
                              <strong>Suggestions:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {imageValidation.suggestions.map((suggestion, index) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-muted-foreground mb-2">Upload a photo of the issue</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Choose Photo
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isValidatingImage || (imageValidation && !imageValidation.isValid)}
              >
                {isSubmitting ? "Submitting Report..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
