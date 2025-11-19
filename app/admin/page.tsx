"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Shield, Building2, CreditCard, Settings, Palette } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase/client"

type School = {
  id: string
  name: string
  branding?: {
    logo?: string
    plan?: string
    url?: string
    theme?: Record<string, any>
  }
  created_at: string
}

export default function AdminDashboardPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSchools()
  }, [])

  const loadSchools = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSchools(data || [])
      if (data && data.length > 0) {
        setSelectedSchool(data[0])
      }
    } catch (error) {
      console.error('Error loading schools:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanBadgeColor = (plan?: string) => {
    switch (plan) {
      case 'enterprise':
        return { className: 'text-purple-700 dark:text-purple-300', style: { backgroundColor: 'rgb(245 158 11 / 0.08)' } }
      case 'professional':
        return { className: 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]', style: { backgroundColor: 'var(--color-light-highlight)' } }
      case 'basic':
        return { className: 'text-gray-700 dark:text-gray-300', style: { backgroundColor: 'rgb(243 244 246 / 1)' } }
      default:
        return { className: 'text-gray-700 dark:text-gray-300', style: { backgroundColor: 'rgb(243 244 246 / 1)' } }
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading dashboard...</div>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5" />
            <span>Platform Administration</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage schools, branding, features, and billing</p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schools.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {schools.filter(s => s.branding?.plan === 'enterprise').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Professional</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {schools.filter(s => s.branding?.plan === 'professional').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Basic</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {schools.filter(s => s.branding?.plan === 'basic' || !s.branding?.plan).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="schools" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schools">Schools</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            {/* Schools Tab */}
            <TabsContent value="schools">
              <Card>
                <CardHeader>
                  <CardTitle>Schools</CardTitle>
                  <CardDescription>Manage all schools on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {schools.map(school => (
                      <div
                        key={school.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => setSelectedSchool(school)}
                      >
                        <div className="flex items-center gap-4">
                          {school.branding?.logo ? (
                            <img 
                              src={school.branding.logo} 
                              alt={school.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{school.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(school.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {(() => { const badgeStyle = getPlanBadgeColor(school.branding?.plan); return (
                          <Badge className={badgeStyle.className} style={badgeStyle.style}>
                            {school.branding?.plan?.toUpperCase() || 'BASIC'}
                          </Badge>
                        ) })()}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding Settings</CardTitle>
                  <CardDescription>
                    {selectedSchool ? `Configure branding for ${selectedSchool.name}` : 'Select a school to configure branding'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSchool ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>School Name</Label>
                        <Input 
                          defaultValue={selectedSchool.name} 
                          placeholder="Enter school name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input 
                          defaultValue={selectedSchool.branding?.logo || ''} 
                          placeholder="https://example.com/logo.png"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input 
                          defaultValue={selectedSchool.branding?.url || ''} 
                          placeholder="https://school.edu"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Plan</Label>
                        <select className="w-full p-2 border rounded-md" defaultValue={selectedSchool.branding?.plan || 'basic'}>
                          <option value="basic">Basic</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Theme Colors
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Primary Color</Label>
                            <Input type="color" defaultValue={typeof window !== 'undefined' ? (getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#3b82f6') : '#3b82f6'} />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Secondary Color</Label>
                            <Input type="color" defaultValue={typeof window !== 'undefined' ? (getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim() || '#8b5cf6') : '#8b5cf6'} />
                          </div>
                        </div>
                      </div>

                      <Button className="w-full">
                        Save Branding Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Palette className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        Select a school from the Schools tab to configure branding
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>Enable or disable features for schools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">Custom Question Creation</div>
                        <div className="text-sm text-muted-foreground">Allow schools to create custom questions</div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">Video Explanations</div>
                        <div className="text-sm text-muted-foreground">Request and manage video explanation requests</div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">Advanced Analytics</div>
                        <div className="text-sm text-muted-foreground">Detailed performance and trend analysis</div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Payments</CardTitle>
                  <CardDescription>Manage subscriptions and payment information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-20">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Billing Integration Coming Soon</h3>
                    <p className="text-muted-foreground text-center">
                      Payment processing and subscription management will be available soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
