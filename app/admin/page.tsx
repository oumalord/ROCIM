"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, Clock, CheckCircle, RefreshCw, Shield, MapPin, UserCheck, Target } from "lucide-react"

interface AdminStats {
  totalRegistrations: number
  totalMissionRegistrations: number
  verifiedPayments: number
  pendingPayments: number
  totalRevenue: number
  unitDistribution: Record<string, number>
  roleDistribution: Record<string, number>
  recentRegistrations: any[]
  recentMissionRegistrations: any[]
}

interface RegistrationWithPayment {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  ministry: string
  rocimUnit: string
  role: string
  createdAt: string
  payment?: {
    id: string
    mpesaCode: string
    amount: number
    status: string
    verifiedAt?: string
  }
}

interface MissionRegistration {
  id: string
  rocimRegistrationId: string
  officialName: string
  email: string
  areaOfResidence: string
  contacts: string
  ministry: string
  healthHistory: string
  arrivalDate: string
  arrivalTime: string
  arrivalPeriod: "AM" | "PM"
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationWithPayment[]>([])
  const [missionRegistrations, setMissionRegistrations] = useState<MissionRegistration[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database/contents")
      const result = await response.json()

      if (result.success) {
        setStats(result.data.stats)
        setRegistrations(result.data.registrations)
        setMissionRegistrations(result.data.missionRegistrations || [])
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatUnitName = (unit: string) => {
    const unitNames: Record<string, string> = {
      "cambridge-unit": "Cambridge Unit",
      "diaspora-unit": "Diaspora Unit",
      "moi-unit": "Moi Unit",
    }
    return unitNames[unit] || unit.replace("-", " ")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const verifiedRegistrations = registrations.filter((r) => r.payment?.status === "verified")
  const pendingRegistrations = registrations.filter((r) => r.payment?.status === "pending" || !r.payment)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ROCIM Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage registrations, payments, and missions</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSH {stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From {stats.verifiedPayments} verified payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROCIM Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">{stats.verifiedPayments} with verified payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mission Registrations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMissionRegistrations}</div>
              <p className="text-xs text-muted-foreground">For Kwoyo-Oyugis mission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRegistrations > 0
                  ? Math.round((stats.verifiedPayments / stats.totalRegistrations) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Payment verification rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                ROCIM Unit Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.unitDistribution).map(([unit, count]) => (
                  <div key={unit} className="flex items-center justify-between">
                    <span className="text-sm">{formatUnitName(unit)}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.roleDistribution).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{role.replace("-", " ")}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="verified">Verified Members</TabsTrigger>
          <TabsTrigger value="missions">Mission Registrations</TabsTrigger>
          <TabsTrigger value="all">All ROCIM Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payment Verification</CardTitle>
              <CardDescription>Registrations awaiting payment verification</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRegistrations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending verifications</p>
              ) : (
                <div className="space-y-4">
                  {pendingRegistrations.map((registration) => (
                    <div key={registration.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {registration.firstName} {registration.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {registration.email} • {registration.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {registration.ministry} • {formatUnitName(registration.rocimUnit)} •{" "}
                            {registration.role.replace("-", " ")}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Pending
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p>Registration ID: {registration.id}</p>
                        <p>Created: {new Date(registration.createdAt).toLocaleString()}</p>
                        {registration.payment && <p>M-Pesa Code: {registration.payment.mpesaCode}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verified Ministry Members</CardTitle>
              <CardDescription>Successfully registered and verified members</CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedRegistrations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No verified registrations</p>
              ) : (
                <div className="space-y-4">
                  {verifiedRegistrations.map((registration) => (
                    <div key={registration.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {registration.firstName} {registration.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {registration.email} • {registration.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {registration.ministry} • {formatUnitName(registration.rocimUnit)} •{" "}
                            {registration.role.replace("-", " ")}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2">
                        <p>Registration ID: {registration.id}</p>
                        <p>M-Pesa Code: {registration.payment?.mpesaCode}</p>
                        <p>
                          Verified:{" "}
                          {registration.payment?.verifiedAt
                            ? new Date(registration.payment.verifiedAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Mission Registrations - Kwoyo Oyugis
              </CardTitle>
              <CardDescription>Members registered for the September 30th - October 5th, 2025 mission</CardDescription>
            </CardHeader>
            <CardContent>
              {missionRegistrations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No mission registrations yet</p>
              ) : (
                <div className="space-y-4">
                  {missionRegistrations.map((missionReg) => (
                    <div key={missionReg.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{missionReg.officialName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {missionReg.email} • {missionReg.contacts}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {missionReg.ministry} • {missionReg.areaOfResidence}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-blue-600">
                          <Target className="h-3 w-3 mr-1" />
                          Mission
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <p>
                            <strong>ROCIM ID:</strong> {missionReg.rocimRegistrationId}
                          </p>
                          <p>
                            <strong>Arrival:</strong> {missionReg.arrivalDate} at {missionReg.arrivalTime}{" "}
                            {missionReg.arrivalPeriod}
                          </p>
                          <p>
                            <strong>Registered:</strong> {new Date(missionReg.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Health Status:</strong> {missionReg.healthHistory}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All ROCIM Registrations</CardTitle>
              <CardDescription>Complete list of all registration attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No registrations found</p>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {registration.firstName} {registration.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {registration.email} • {registration.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {registration.ministry} • {formatUnitName(registration.rocimUnit)} •{" "}
                            {registration.role.replace("-", " ")}
                          </p>
                        </div>
                        <Badge
                          variant={registration.payment?.status === "verified" ? "default" : "outline"}
                          className={
                            registration.payment?.status === "verified"
                              ? "bg-green-600"
                              : "text-orange-600 border-orange-600"
                          }
                        >
                          {registration.payment?.status === "verified" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              {registration.payment ? "Pending" : "No Payment"}
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2">
                        <p>Registration ID: {registration.id}</p>
                        <p>Created: {new Date(registration.createdAt).toLocaleString()}</p>
                        {registration.payment && (
                          <>
                            <p>M-Pesa Code: {registration.payment.mpesaCode}</p>
                            <p>Amount: KSH {registration.payment.amount}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access:</strong> This dashboard provides access to sensitive payment and registration data.
          Ensure proper authentication and access controls are implemented in production.
        </AlertDescription>
      </Alert>
    </div>
  )
}
