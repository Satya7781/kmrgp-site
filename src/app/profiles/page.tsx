import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Home, ShieldAlert } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { listApprovedProfiles } from "@/lib/services/profileService"
import { ProfilesClient } from "@/components/profiles/ProfilesClient"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ProfilesPage() {
  const session = await getSession()

  if (!session) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center bg-cream px-6 pt-[76px]">
          <div className="max-w-md rounded-3xl border-4 border-double border-maroon bg-white p-10 text-center shadow-lg">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-maroon" />
            <h2 className="mb-2 font-heading text-2xl font-bold text-maroon">Verified Access Only</h2>
            <p className="mb-6 text-muted-foreground">Please log in from the home page to browse verified profiles.</p>
            <Button asChild className="w-full">
              <Link href="/"><Home className="mr-2 h-4 w-4" /> Go to Home</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!session.isApproved && session.role === "USER") {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center bg-cream px-6 pt-[76px]">
          <div className="max-w-lg rounded-3xl border-2 border-dashed border-gold bg-white p-10 text-center">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-gold" />
            <h2 className="mb-2 font-heading text-2xl font-bold text-maroon">Verification Pending</h2>
            <p className="mb-6 text-muted-foreground">Your profile is awaiting admin verification. You will be able to browse once approved.</p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const profiles = await listApprovedProfiles()

  return (
    <>
      <Header />
      <ProfilesClient initialProfiles={profiles} user={session} />
      <Footer />
    </>
  )
}
