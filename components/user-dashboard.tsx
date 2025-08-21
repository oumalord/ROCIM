"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  LogOut,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MissionRegistrationForm } from "./mission-registration-form"

interface UserData {
  id: string
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
  profileImage?: string
  createdAt: string
  payment?: {
    id: string
    mpesaCode: string
    amount: number
    status: string
    verifiedAt?: string
  }
}

interface UserDashboardProps {
  registrationId: string
}

export function UserDashboard({ registrationId }: UserDashboardProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<UserData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [registrationId])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/profile?registrationId=${registrationId}`)
      const result = await response.json()

      if (result.success) {
        setUserData(result.data)
      } else {
        setError(result.error || "Failed to load user data")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to load user data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("rocim_logged_in")
    localStorage.removeItem("rocim_user_id")
    router.push("/login")
  }

  const startEditing = () => {
    if (!userData) return
    setEditData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      occupation: userData.occupation,
      emergencyContact: userData.emergencyContact,
      emergencyPhone: userData.emergencyPhone,
      testimony: userData.testimony,
      ministry: userData.ministry,
      rocimUnit: userData.rocimUnit,
      profileImage: userData.profileImage,
      gender: userData.gender,
      dateOfBirth: userData.dateOfBirth,
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditData({})
  }

  const saveProfile = async () => {
    if (!userData) return
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: userData.id, updates: editData }),
      })
      const result = await response.json()
      if (result.success) {
        setUserData(result.data)
        setIsEditing(false)
      } else {
        setError(result.error || "Failed to save profile")
      }
    } catch (e) {
      console.error("Save profile error:", e)
      setError("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const printReceipt = () => {
    if (!userData) return
    const paymentCode = userData.payment?.mpesaCode || ""
    const verifiedAt = userData.payment?.verifiedAt
      ? new Date(userData.payment.verifiedAt).toLocaleString()
      : new Date().toLocaleString()
    const unit = getUnitDisplayName(userData.rocimUnit)

    const receiptHtml = `
      <html>
        <head>
          <title>ROCIM Receipt - ${userData.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .header { display:flex; align-items:center; gap:16px; border-bottom:1px solid #ddd; padding-bottom:12px; margin-bottom:16px; }
            .logo { width:64px; height:64px; object-fit:contain; }
            .title { font-size:18px; font-weight:700; }
            .muted { color:#666; }
            table { width:100%; border-collapse:collapse; margin-top:12px; }
            td { padding:8px 6px; border-bottom:1px solid #eee; vertical-align:top; }
            .label { width:220px; color:#444; }
            .amount { font-weight:700; color:#0f766e; }
            .footer { margin-top:16px; font-size:12px; color:#666; }
          </style>
        </head>
        <body>
          <div class=\"header\"> 
            <img class=\"logo\" src=\"${location.origin}/images/rocim-logo.png\" />
            <div>
              <div class=\"title\">REVEALERS OF CHRIST INTERNATIONAL MINISTRY (ROCIM)</div>
              <div class=\"muted\">Official Receipt</div>
            </div>
          </div>
          <table>
            <tr><td class=\"label\">Member Name</td><td>${userData.firstName} ${userData.lastName}</td></tr>
            <tr><td class=\"label\">Registration ID</td><td>${userData.id}</td></tr>
            <tr><td class=\"label\">Unit</td><td>${unit}</td></tr>
            <tr><td class=\"label\">Amount</td><td class=\"amount\">KSH 200</td></tr>
            <tr><td class=\"label\">Payment Code</td><td>${paymentCode}</td></tr>
            <tr><td class=\"label\">Payment Date</td><td>${verifiedAt}</td></tr>
            <tr><td class=\"label\">Ministry</td><td>${getMinistryDisplayName(userData.ministry)}</td></tr>
            <tr><td class=\"label\">Email</td><td>${userData.email}</td></tr>
            <tr><td class=\"label\">Phone</td><td>${userData.phone}</td></tr>
          </table>
          <div class=\"footer\">Thank you for supporting the ministry. Keep this receipt for your records.</div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
        </body>
      </html>`

    const w = window.open("", "_blank")
    if (w) {
      w.document.open()
      w.document.write(receiptHtml)
      w.document.close()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getUnitDisplayName = (unit: string) => {
    const unitNames: Record<string, string> = {
      "cambridge-unit": "Cambridge Unit",
      "moi-unit": "Moi Unit",
      "diaspora-unit": "Diaspora Unit",
    }
    return unitNames[unit] || unit
  }

  const getMinistryDisplayName = (ministry: string) => {
    const ministryNames: Record<string, string> = {
      worship: "Worship",
      intercessory: "Intercessory",
      "bible-study": "Bible Study",
      discipleship: "Discipleship",
      catering: "Catering",
    }
    return ministryNames[ministry] || ministry
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      member: "Member",
      "youth-leader": "Youth Leader",
      "worship-leader": "Worship Leader",
      "prayer-warrior": "Prayer Warrior",
      evangelist: "Evangelist",
      teacher: "Teacher",
      deacon: "Deacon",
      elder: "Elder",
      pastor: "Pastor",
      volunteer: "Volunteer",
    }
    return roleNames[role] || role
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error || "User data not found"}</AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              <Button onClick={() => fetchUserData()} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleLogout} className="w-full bg-transparent">
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image src="/images/rocim-logo.png" alt="ROCIM Logo" width={50} height={50} className="object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ROCIM Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {userData.firstName}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button variant="default" onClick={startEditing}>
                  Edit Profile
                </Button>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={saveProfile} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs for Profile and Missions */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="missions" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Missions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex flex-col items-center space-y-4">
                      {userData.profileImage ? (
                        <Image
                          src={userData.profileImage || "/placeholder.svg"}
                          alt="Profile"
                          width={120}
                          height={120}
                          className="rounded-full object-cover border-4 border-primary/20"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                          <User className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="text-center">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            <input
                              className="border rounded px-3 py-2"
                              value={editData.firstName || ""}
                              onChange={(e) => setEditData((p) => ({ ...p, firstName: e.target.value }))}
                              placeholder="First Name"
                            />
                            <input
                              className="border rounded px-3 py-2"
                              value={editData.lastName || ""}
                              onChange={(e) => setEditData((p) => ({ ...p, lastName: e.target.value }))}
                              placeholder="Last Name"
                            />
                          </div>
                        ) : (
                          <h2 className="text-2xl font-bold">
                            {userData.firstName} {userData.lastName}
                          </h2>
                        )}
                        <p className="text-muted-foreground font-mono text-sm">{userData.id}</p>
                        <div className="flex flex-wrap gap-2 mt-3 justify-center">
                          <Badge variant="secondary">{getUnitDisplayName(userData.rocimUnit)}</Badge>
                          <Badge variant="outline">{getRoleDisplayName(userData.role)}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Payment Status */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        {userData.payment?.status === "verified" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-orange-600" />
                        )}
                        <span className="font-medium">Payment Status</span>
                      </div>
                      <Badge variant={userData.payment?.status === "verified" ? "default" : "secondary"}>
                        {userData.payment?.status === "verified" ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    {userData.payment?.status === "verified" && (
                      <Button className="w-full" onClick={printReceipt}>Download Receipt (PDF)</Button>
                    )}

                    {/* Ministry Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ministry</h3>
                      {isEditing ? (
                        <input
                          className="border rounded px-3 py-2 w-full"
                          value={editData.ministry || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, ministry: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium">{getMinistryDisplayName(userData.ministry)}</p>
                      )}
                    </div>

                    {/* Member Since */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Member Since
                      </h3>
                      <p className="font-medium">{formatDate(userData.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      {isEditing ? (
                        <input
                          className="border rounded px-3 py-2 w-full"
                          value={editData.email || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium">{userData.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Phone</span>
                      </div>
                      {isEditing ? (
                        <input
                          className="border rounded px-3 py-2 w-full"
                          value={editData.phone || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium">{userData.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Date of Birth</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="date"
                          className="border rounded px-3 py-2 w-full"
                          value={editData.dateOfBirth || userData.dateOfBirth}
                          onChange={(e) => setEditData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium">{formatDate(userData.dateOfBirth)}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Gender</span>
                      </div>
                      {isEditing ? (
                        <input
                          className="border rounded px-3 py-2 w-full"
                          value={editData.gender || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, gender: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium capitalize">{userData.gender}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Address</span>
                      </div>
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            className="border rounded px-3 py-2 w-full"
                            placeholder="Address"
                            value={editData.address || ""}
                            onChange={(e) => setEditData((p) => ({ ...p, address: e.target.value }))}
                          />
                          <input
                            className="border rounded px-3 py-2 w-full"
                            placeholder="City"
                            value={editData.city || ""}
                            onChange={(e) => setEditData((p) => ({ ...p, city: e.target.value }))}
                          />
                        </div>
                      ) : (
                        <p className="font-medium">
                          {userData.address}, {userData.city}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>Occupation</span>
                      </div>
                      {isEditing ? (
                        <input
                          className="border rounded px-3 py-2 w-full"
                          value={editData.occupation || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, occupation: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium">{userData.occupation || "Not specified"}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Emergency Contact</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Contact Name</span>
                      </div>
                      <p className="font-medium">{userData.emergencyContact}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Contact Phone</span>
                      </div>
                      <p className="font-medium">{userData.emergencyPhone}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                {userData.payment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Payment Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">M-Pesa Code</div>
                        <p className="font-mono font-medium">{userData.payment.mpesaCode}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Amount Paid</div>
                        <p className="font-medium">KSH {userData.payment.amount}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge variant={userData.payment.status === "verified" ? "default" : "secondary"}>
                          {userData.payment.status === "verified" ? "Verified" : "Pending"}
                        </Badge>
                      </div>

                      {userData.payment.verifiedAt && (
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Verified On</div>
                          <p className="font-medium">{formatDate(userData.payment.verifiedAt)}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Testimony */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Testimony</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <textarea
                        className="border rounded px-3 py-2 w-full min-h-32"
                        value={editData.testimony || ""}
                        onChange={(e) => setEditData((p) => ({ ...p, testimony: e.target.value }))}
                        placeholder="Share your testimony"
                      />
                    ) : (
                      <p className="text-muted-foreground leading-relaxed">{userData.testimony || ""}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Missions Tab Content */}
          <TabsContent value="missions">
            <MissionRegistrationForm userData={userData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
