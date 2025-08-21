"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Phone, Upload, X, User } from "lucide-react"
import { MpesaPayment } from "@/components/mpesa-payment"
import { RegistrationSuccess } from "@/components/registration-success"
import Image from "next/image"

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  city: string
  occupation: string
  emergencyContact: string
  emergencyPhone: string
  testimony: string
  ministry: string
  rocimUnit: string
  role: string
  profileImage: string // Added profile image field
}

type RegistrationStep = "form" | "payment" | "success"

export function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    occupation: "",
    emergencyContact: "",
    emergencyPhone: "",
    testimony: "",
    ministry: "",
    rocimUnit: "",
    role: "",
    profileImage: "", // Initialize profile image
  })

  const [currentStep, setCurrentStep] = useState<RegistrationStep>("form")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [registrationId, setRegistrationId] = useState<string>("")
  const [imagePreview, setImagePreview] = useState<string>("") // Added image preview state
  const [isUploadingImage, setIsUploadingImage] = useState(false) // Added upload loading state

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, profileImage: "Please select a valid image file" }))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, profileImage: "Image size must be less than 5MB" }))
      return
    }

    setIsUploadingImage(true)

    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setFormData((prev) => ({ ...prev, profileImage: base64String }))
        setImagePreview(base64String)
        setErrors((prev) => ({ ...prev, profileImage: "" }))
        setIsUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Image upload error:", error)
      setErrors((prev) => ({ ...prev, profileImage: "Failed to upload image. Please try again." }))
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, profileImage: "" }))
    setImagePreview("")
    setErrors((prev) => ({ ...prev, profileImage: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
    if (!formData.gender) newErrors.gender = "Gender is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = "Emergency contact is required"
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = "Emergency phone is required"
    if (!formData.ministry.trim()) newErrors.ministry = "Ministry is required"
    if (!formData.rocimUnit) newErrors.rocimUnit = "ROCIM unit is required"
    if (!formData.role) newErrors.role = "Role is required"

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (formData.phone && !/^(\+254|0)[17]\d{8}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number"
    }

    if (formData.emergencyPhone && !/^(\+254|0)[17]\d{8}$/.test(formData.emergencyPhone)) {
      newErrors.emergencyPhone = "Please enter a valid Kenyan phone number"
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 16) {
        newErrors.dateOfBirth = "You must be at least 16 years old to register"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleProceedToPayment = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/registration/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setRegistrationId(result.data.id)
        setCurrentStep("payment")
      } else {
        if (result.error.includes("already registered")) {
          setErrors({ email: result.error })
        } else {
          alert(`Registration failed: ${result.error}`)
        }
      }
    } catch (error) {
      console.error("Registration creation error:", error)
      alert("Failed to create registration. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = async () => {
    setCurrentStep("success")
  }

  const handleStartOver = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      city: "",
      occupation: "",
      emergencyContact: "",
      emergencyPhone: "",
      testimony: "",
      ministry: "",
      rocimUnit: "",
      role: "",
      profileImage: "", // Reset profile image
    })
    setCurrentStep("form")
    setErrors({})
    setRegistrationId("")
    setImagePreview("") // Reset image preview
  }

  if (currentStep === "success") {
    return <RegistrationSuccess registrationId={registrationId} email={formData.email} onStartOver={handleStartOver} />
  }

  if (currentStep === "payment") {
    return (
      <MpesaPayment
        amount={200}
        phoneNumber="0703877167"
        registrationId={registrationId}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setCurrentStep("form")}
        registrationData={formData}
      />
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-8">
        <div className="flex flex-col items-center space-y-6 mb-2">
          <div className="relative">
            <Image
              src="/images/rocim-logo.png"
              alt="REVEALERS OF CHRIST INTERNATIONAL MINISTRIES Logo"
              width={140}
              height={140}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">REVEALERS OF CHRIST</h1>
            <h2 className="text-xl font-semibold text-orange-600 tracking-widest">INTERNATIONAL MINISTRIES</h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-3"></div>
          </div>
        </div>

        <CardTitle className="text-2xl text-primary mt-6">Ministry Registration</CardTitle>
        <CardDescription className="text-base">
          Please fill in all required information. Registration fee: KSH 200
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Profile Photo</h3>

          <div className="flex flex-col items-center space-y-4">
            {/* Image Preview */}
            <div className="relative">
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Profile preview"
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-primary/20"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="profileImage" className="cursor-pointer">
                <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                  {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{imagePreview ? "Change Photo" : "Upload Photo"}</span>
                </div>
              </Label>
              <Input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
              <p className="text-xs text-muted-foreground text-center">Optional. Max 5MB. JPG, PNG, or GIF format.</p>
              {errors.profileImage && <p className="text-sm text-destructive text-center">{errors.profileImage}</p>}
            </div>
          </div>
        </div>

        {/* Ministry Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Ministry Information</h3>

          <div className="space-y-2">
            <Label htmlFor="ministry">Ministry *</Label>
            <Select value={formData.ministry} onValueChange={(value) => handleInputChange("ministry", value)}>
              <SelectTrigger className={errors.ministry ? "border-destructive" : ""}>
                <SelectValue placeholder="Select your ministry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worship">Worship</SelectItem>
                <SelectItem value="intercessory">Intercessory</SelectItem>
                <SelectItem value="bible-study">Bible Study</SelectItem>
                <SelectItem value="discipleship">Discipleship</SelectItem>
                <SelectItem value="catering">Catering</SelectItem>
              </SelectContent>
            </Select>
            {errors.ministry && <p className="text-sm text-destructive">{errors.ministry}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rocimUnit">ROCIM Unit *</Label>
              <Select value={formData.rocimUnit} onValueChange={(value) => handleInputChange("rocimUnit", value)}>
                <SelectTrigger className={errors.rocimUnit ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cambridge-unit">Cambridge Unit</SelectItem>
                  <SelectItem value="moi-unit">Moi Unit</SelectItem>
                  <SelectItem value="diaspora-unit">Diaspora Unit</SelectItem>
                </SelectContent>
              </Select>
              {errors.rocimUnit && <p className="text-sm text-destructive">{errors.rocimUnit}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="youth-leader">Youth Leader</SelectItem>
                  <SelectItem value="worship-leader">Worship Leader</SelectItem>
                  <SelectItem value="prayer-warrior">Prayer Warrior</SelectItem>
                  <SelectItem value="evangelist">Evangelist</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="deacon">Deacon</SelectItem>
                  <SelectItem value="elder">Elder</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="0712345678 or +254712345678"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                className={errors.dateOfBirth ? "border-destructive" : ""}
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
              <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Address Information</h3>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleInputChange("occupation", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Contact Name *</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                className={errors.emergencyContact ? "border-destructive" : ""}
              />
              {errors.emergencyContact && <p className="text-sm text-destructive">{errors.emergencyContact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Contact Phone *</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                className={errors.emergencyPhone ? "border-destructive" : ""}
              />
              {errors.emergencyPhone && <p className="text-sm text-destructive">{errors.emergencyPhone}</p>}
            </div>
          </div>
        </div>

        {/* Testimony */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Testimony (Optional)</h3>
          <div className="space-y-2">
            <Label htmlFor="testimony">Share your testimony or reason for joining</Label>
            <Textarea
              id="testimony"
              value={formData.testimony}
              onChange={(e) => handleInputChange("testimony", e.target.value)}
              placeholder="Tell us about your faith journey or why you want to join ROCIM..."
              rows={4}
            />
          </div>
        </div>

        {/* Payment Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Secure Payment Required:</strong> A registration fee of KSH 200 is required to complete your
            registration. You will be redirected to M-Pesa payment after reviewing your information.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <Button onClick={handleProceedToPayment} className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Registration...
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Proceed to M-Pesa Payment (KSH 200)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
