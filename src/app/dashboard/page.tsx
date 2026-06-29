import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { BioDataEditor } from "@/components/dashboard/BioDataEditor"
import { InterestsList } from "@/components/dashboard/InterestsList"
import { AdminPanel } from "@/components/dashboard/AdminPanel"
import { SuperAdminPanel } from "@/components/dashboard/SuperAdminPanel"
import { getSession } from "@/lib/auth/session"
import { getMyProfile } from "@/lib/actions/profile"
import { Home, Lock, Heart, Sparkles, Eye, Shield, Crown } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center bg-cream px-6 pt-[76px]">
          <div className="max-w-md rounded-3xl border-4 border-double border-maroon bg-white p-10 text-center shadow-lg">
            <Lock className="mx-auto mb-4 h-12 w-12 text-maroon" />
            <h2 className="mb-2 font-heading text-2xl font-bold text-maroon">Verified Access Only</h2>
            <p className="mb-6 text-muted-foreground">This dashboard is reserved for verified family members. Please log in from the home page.</p>
            <Button asChild className="w-full">
              <Link href="/"><Home className="mr-2 h-4 w-4" /> Go to Home</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const profile = await getMyProfile()

  if (!profile) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center bg-cream px-6 pt-[76px]">
          <Card className="max-w-md p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-maroon">Profile Not Found</h2>
            <p className="mt-2 text-muted-foreground">Please register to create a profile.</p>
          </Card>
        </div>
        <Footer />
      </>
    )
  }

  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN"
  const isSuperAdmin = session.role === "SUPER_ADMIN"

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pb-20 pt-[76px]">
        <section
          className="relative flex min-h-[320px] items-center justify-center bg-cover bg-center px-6 py-16"
          style={{ backgroundImage: "url('/images/ram_sita_vivah.png')" }}
        >
          <div className="absolute inset-0 bg-maroon/70" />
          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
              <Sparkles className="h-4 w-4" /> My Parivar Workspace
            </div>
            <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">Welcome to Your Profile Dashboard</h1>
            <p className="mt-2 text-cream-dark">Preserving Our Lineage, Uniting Our Families</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <StatCard icon={Eye} value={142} label="Profile Views" />
            <StatCard icon={Heart} value={28} label="Interests Received" />
            <StatCard icon={Sparkles} value={12} label="New Matches" />
          </div>

          <Tabs defaultValue={isAdmin ? "admin" : "profile"} className="w-full">
            <TabsList className="mb-6 flex w-full flex-wrap justify-center gap-2 md:w-auto">
              <TabsTrigger value="profile">My Profile & Bio-Data</TabsTrigger>
              <TabsTrigger value="interests">Received Interests</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin"><Shield className="mr-1 h-4 w-4" /> Admin Controls</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="superadmin"><Crown className="mr-1 h-4 w-4" /> Super Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="profile">
              <BioDataEditor profile={profile} role={session.role} />
            </TabsContent>

            <TabsContent value="interests">
              <InterestsList />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <AdminPanel />
              </TabsContent>
            )}

            {isSuperAdmin && (
              <TabsContent value="superadmin">
                <SuperAdminPanel />
              </TabsContent>
            )}
          </Tabs>
        </section>
      </main>
      <Footer />
    </>
  )
}

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron/10 text-saffron">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="font-heading text-2xl font-bold text-maroon">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  )
}
