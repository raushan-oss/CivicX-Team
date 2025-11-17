"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Camera, Upload, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

// dynamic imports for react-leaflet components (ssr: false)
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

// client-only MapClickHandler (keeps hooks in a client component)
const MapClickHandler = dynamic(() => import("@/components/MapClickHandler.client"), { ssr: false });

export default function NewReport() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    location: "",
    coords: null,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidation, setImageValidation] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Ensure Leaflet library & CSS are only loaded in browser runtime
  useEffect(() => {
    let cancelled = false;

    async function setupLeaflet() {
      if (typeof document !== "undefined" && !document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      try {
        const LModule = await import("leaflet");
        const L = LModule.default || LModule;
        if (cancelled) return;

        if (L && L.Icon && L.Icon.Default) {
          try {
            delete L.Icon.Default.prototype._getIconUrl;
          } catch (e) {
            // ignore
          }
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          });
        }
      } catch (err) {
        // Leaflet unavailable during SSR/build — ignore here
        // eslint-disable-next-line no-console
        console.warn("Leaflet not initialized (likely running on server).", err);
      }
    }

    setupLeaflet();
    return () => {
      cancelled = true;
    };
  }, []);

  // Protect route: only allow 'user'
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("userRole");
    if (role !== "user") router.push("/");
  }, [router]);

  // IMAGE upload and AI validation
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target.result;
      setImagePreview(imageData);
      setFormData((prev) => ({ ...prev, image: imageData }));

      setIsValidatingImage(true);
      setImageValidation(null);

      try {
        const response = await fetch("/api/validate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData }),
        });

        const validation = await response.json();
        setImageValidation(validation);
      } catch (error) {
        setImageValidation({
          isValid: false,
          confidence: 0,
          message: "Failed to validate image. Please try again.",
          suggestions: ["Try uploading again"],
        });
      } finally {
        setIsValidatingImage(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Reverse geocode helper (Nominatim)
  async function reverseGeocode(lat, lon) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const data = await res.json();
      const addr = data.address || {};
      const area = addr.neighbourhood || addr.suburb || addr.county || "";
      const city = addr.city || addr.town || addr.village || "";
      const pincode = addr.postcode || "";
      const parts = [area, city, pincode].filter((p) => p && p.trim() !== "");
      const place = parts.length ? parts.join(", ") : data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      return place;
    } catch (err) {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }

  // Geocode typed address -> coordinates (Nominatim)
  async function geocodeAddress(address) {
    if (!address || address.trim() === "") return null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // When location string changes (typed or set), try geocoding after short debounce
  useEffect(() => {
    let t;
    async function doGeocode() {
      if (formData.coords) return;
      const coords = await geocodeAddress(formData.location);
      if (coords) {
        setFormData((prev) => ({ ...prev, coords }));
      }
    }
    t = setTimeout(doGeocode, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.location]);

  // Use current location — set human-readable location and coords
  const getCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({ ...prev, coords: { lat: latitude, lng: longitude } }));
        setLocationError("");
        const placeName = await reverseGeocode(latitude, longitude);
        setFormData((prev) => ({ ...prev, location: placeName, coords: { lat: latitude, lng: longitude } }));
      },
      () => setLocationError("Unable to retrieve location. Enter manually.")
    );
  };

  // Submit new report
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.location) {
      alert("Please fill all required fields");
      return;
    }

    if (imageValidation && !imageValidation.isValid) {
      alert("Upload a valid image showing the issue");
      return;
    }

    setIsSubmitting(true);

    const newReport = {
      id: Date.now().toString(),
      ...formData,
      status: "pending",
      createdAt: new Date().toISOString(),
      userEmail: typeof window !== "undefined" ? localStorage.getItem("userEmail") : null,
      aiValidation: imageValidation,
    };

    const existingReports = JSON.parse(localStorage.getItem("userReports") || "[]");
    const allReports = JSON.parse(localStorage.getItem("allReports") || "[]");

    existingReports.push(newReport);
    allReports.push(newReport);

    localStorage.setItem("userReports", JSON.stringify(existingReports));
    localStorage.setItem("allReports", JSON.stringify(allReports));

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/dashboard/user");
    }, 1500);
  };

  /************* MapViewer inner component *************/
  function MapViewer({ coords, locationText }) {
    const center = coords || { lat: 20.5937, lng: 78.9629 }; // default India center
    const [markerPos, setMarkerPos] = useState(coords);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
      setMarkerPos(coords);
      setLoaded(true);
    }, [coords]);

    if (!MapContainer || !TileLayer || !Marker || !Popup) {
      return <div className="h-64 flex items-center justify-center">Loading map...</div>;
    }

    return (
      <div className="w-full h-64 rounded overflow-hidden shadow-sm">
        {/* @ts-ignore */}
        <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
          {/* @ts-ignore */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler
            onPlaceSelected={(data) => {
              setMarkerPos({ lat: data.lat, lng: data.lng });
              setFormData((prev) => ({ ...prev, location: data.place, coords: { lat: data.lat, lng: data.lng } }));
            }}
          />
          {markerPos && (
            // @ts-ignore
            <Marker position={[markerPos.lat, markerPos.lng]}>
              {/* @ts-ignore */}
              <Popup>{locationText || `${markerPos.lat.toFixed(6)}, ${markerPos.lng.toFixed(6)}`}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    );
  }

  /************* JSX: form UI *************/
  return (
    <div className="min-h-screen bg-gray-300">
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard/user" className="inline-flex items-center text-primary hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Report Civic Issue</CardTitle>
            <CardDescription>Help improve the community by reporting issues</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TITLE */}
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  placeholder="e.g., Large pothole on Main Street"
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe the issue..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* LOCATION with map below */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.location}
                    placeholder="Enter address or coordinates"
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, location: e.target.value, coords: null }));
                    }}
                    required
                  />
                  <Button type="button" variant="outline" className="gap-2 bg-red-700" onClick={getCurrentLocation}>
                    <MapPin className="w-4 h-4" />
                    Use Current
                  </Button>
                </div>
                {locationError && <p className="text-sm text-red-600">{locationError}</p>}

                {/* LIVE MAP */}
                <div className="mt-3">
                  <MapViewer coords={formData.coords} locationText={formData.location} />
                </div>
              </div>

              {/* PHOTO UPLOAD */}
              <div className="space-y-2">
                <Label>Photo Evidence</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Preview" className="max-w-full h-48 object-cover rounded-lg mx-auto" />

                      {isValidatingImage && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI is analyzing your image...
                        </div>
                      )}

                      {/* Image Validation */}
                      {imageValidation && (
                        <div
                          className={`p-4 rounded-lg border ${
                            imageValidation.isValid ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {imageValidation.isValid ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <span className="font-medium">
                              {imageValidation.isValid ? "Valid Issue" : "Invalid Image"}{" "}
                              {imageValidation.confidence && `(${imageValidation.confidence}% confidence)`}
                            </span>
                          </div>

                          <p className="text-sm mb-2">{imageValidation.message}</p>

                          {imageValidation.suggestions?.length > 0 && (
                            <ul className="list-disc list-inside text-sm">
                              {imageValidation.suggestions.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
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
                      <p className="text-muted-foreground">Upload a photo of the issue</p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Photo
                      </Button>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>

              {/* SUBMIT */}
              <Button type="submit" className="w-full" disabled={isSubmitting || isValidatingImage || (imageValidation && !imageValidation.isValid)}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
