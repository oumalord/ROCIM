"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Target, Calendar, MapPin, CheckCircle, AlertCircle } from "lucide-react"

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  ministry: string
  rocimUnit: string
}

interface MissionRegistrationFormProps {
  userData: UserData
}

interface MissionFormData {
  officialName: string
  areaOfResidence: string
  contacts: string
  ministry: string
  healthHistory: string
  arrivalDate: string
  arrivalTime: string
  arrivalPeriod: "AM" | "PM"
}

export function MissionRegistrationForm({ userData }: MissionRegistrationFormProps) {
  const [formData, setFormData] = useState<MissionFormData>({
    officialName: `${userData.firstName} ${userData.lastName}`,
    areaOfResidence: "",
    contacts: userData.phone,
    ministry: userData.ministry,
    healthHistory: "",
    arrivalDate: "",
    arrivalTime: "",
    arrivalPeriod: "AM",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleInputChange = (field: keyof MissionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const response = await fetch("/api/mission/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rocimRegistrationId: userData.id,
          email: userData.email,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitStatus("success")
      } else {
        setSubmitStatus("error")
        setErrorMessage(result.error || "Failed to register for mission")
      }
    } catch (error) {
      console.error("Mission registration error:", error)
      setSubmitStatus("error")
      setErrorMessage("Failed to register for mission. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const ministryOptions = [
    { value: "praise-worship", label: "Praise and worship" },
    { value: "intercessory-prayer", label: "Intercessory and prayer" },
    { value: "teaching-preaching", label: "Teaching And Preaching" },
    { value: "interpretation-translation", label: "Interpretation / Translation" },
    { value: "ushering", label: "Ushering" },
    { value: "catering", label: "Catering" },
    { value: "media", label: "Media" },
    { value: "technician-instrumentalists", label: "Technician and instrumentalists" },
  ]

  if (submitStatus === "success") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">Mission Registration Successful!</h2>
            <p className="text-muted-foreground">
              Thank you for registering for the ROCIM Mega Mission to Kwoyo - Oyugis. We will contact you with further
              details about the mission.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Mission Details:</p>
              <p className="text-sm text-muted-foreground">September 30th - October 5th, 2025</p>
              <p className="text-sm text-muted-foreground">Kwoyo - Oyugis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mission Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Target className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">ROCIM - MEGA MISSION</CardTitle>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <MapPin className="h-4 w-4 mr-2" />
              KWOYO - OYUGIS
            </Badge>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>September 30th - October 5th, 2025</span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-4">
            Hello and Praise the Lord! Kindly help us get some information to aid our planning of the mission.
          </p>
        </CardHeader>
      </Card>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Mission Registration Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Official Name */}
            <div className="space-y-2">
              <Label htmlFor="officialName">Your Official Name *</Label>
              <Input
                id="officialName"
                value={formData.officialName}
                onChange={(e) => handleInputChange("officialName", e.target.value)}
                required
              />
            </div>

            {/* Area of Residence */}
            <div className="space-y-2">
              <Label htmlFor="areaOfResidence">Your Area of Residence *</Label>
              <Input
                id="areaOfResidence"
                value={formData.areaOfResidence}
                onChange={(e) => handleInputChange("areaOfResidence", e.target.value)}
                placeholder="Enter your area of residence"
                required
              />
            </div>

            {/* Contacts */}
            <div className="space-y-2">
              <Label htmlFor="contacts">Your Official and Available Contacts (WhatsApp and call) *</Label>
              <Input
                id="contacts"
                value={formData.contacts}
                onChange={(e) => handleInputChange("contacts", e.target.value)}
                placeholder="Enter your WhatsApp and phone number"
                required
              />
            </div>

            {/* Ministry */}
            <div className="space-y-2">
              <Label htmlFor="ministry">The Ministry You Serve In *</Label>
              <Select
                value={formData.ministry}
                onValueChange={(value) => handleInputChange("ministry", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your ministry" />
                </SelectTrigger>
                <SelectContent>
                  {ministryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Health History */}
            <div className="space-y-2">
              <Label htmlFor="healthHistory">Health History *</Label>
              <Textarea
                id="healthHistory"
                value={formData.healthHistory}
                onChange={(e) => handleInputChange("healthHistory", e.target.value)}
                placeholder="Please tell us of your health status (Allergy, ulcers and food you don't take)"
                rows={3}
                required
              />
            </div>

            {/* Arrival Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Preferred Date of Arrival *</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => handleInputChange("arrivalDate", e.target.value)}
                  min="2025-09-30"
                  max="2025-10-05"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">Preferred Time of Arrival *</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => handleInputChange("arrivalTime", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalPeriod">Period</Label>
                <Select
                  value={formData.arrivalPeriod}
                  onValueChange={(value: "AM" | "PM") => handleInputChange("arrivalPeriod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Guidelines */}
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">Please Observe the Following</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  • You are required to dress well throughout the mission ground to the latter. Avoid skinny clothes,
                  short dresses and ensure proper grooming.
                </p>
                <p>• You are required to keep time in the mission ground to ensure smooth running of programmes.</p>
                <p>• Ensure safety of each others property, don't take a property that doesn't belong to you.</p>
                <p>
                  • We will have designated assignments for each and everyone of us during the mission. Kindly comply.
                </p>
                <p>
                  • In case of complaints, kindly coordinate with leaders to ensure amicable resolution to issues
                  arising.
                </p>
                <p>• Be reminded of our prayers and fasting on Wednesday and Friday from 6AM - 6PM.</p>
              </CardContent>
            </Card>

            {/* Error Message */}
            {submitStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering for Mission...
                </>
              ) : (
                "Register for Mission"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
