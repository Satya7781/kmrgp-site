"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RotateCcw, Search, SlidersHorizontal, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ProfileCard } from "./ProfileCard"
import { ProfileModal } from "./ProfileModal"
import { sendInterestAction } from "@/lib/actions/interest"
import type { PublicProfile, SessionUser } from "@/types"

interface ProfilesClientProps {
  initialProfiles: PublicProfile[]
  user: SessionUser | null
}

export function ProfilesClient({ initialProfiles, user }: ProfilesClientProps) {
  const router = useRouter()
  const [profiles] = useState(initialProfiles)
  const [selected, setSelected] = useState<PublicProfile | null>(null)

  const [gender, setGender] = useState("all")
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(35)
  const [community, setCommunity] = useState("all")
  const [district, setDistrict] = useState("all")
  const [gotraQuery, setGotraQuery] = useState("")
  const [gotraExclude, setGotraExclude] = useState("")
  const [keyword, setKeyword] = useState("")
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (gender !== "all" && p.type.toLowerCase() !== gender.toLowerCase()) return false
      if (p.age && (p.age < ageMin || p.age > ageMax)) return false
      if (community !== "all" && p.community !== community) return false
      if (district !== "all" && p.district !== district) return false
      if (verifiedOnly && p.approvalStatus !== "APPROVED") return false

      const q = gotraQuery.toLowerCase()
      if (q) {
        const g = `${p.gotraSelf || ""} ${p.gotraMother || ""}`.toLowerCase()
        if (!g.includes(q)) return false
      }

      const ex = gotraExclude.toLowerCase()
      if (ex) {
        const g = `${p.gotraSelf || ""} ${p.gotraMother || ""}`.toLowerCase()
        if (g.includes(ex)) return false
      }

      const k = keyword.toLowerCase()
      if (k) {
        const text = `${p.education || ""} ${p.profession || ""}`.toLowerCase()
        if (!text.includes(k)) return false
      }

      return true
    })
  }, [profiles, gender, ageMin, ageMax, community, district, gotraQuery, gotraExclude, keyword, verifiedOnly])

  function resetFilters() {
    setGender("all")
    setAgeMin(18)
    setAgeMax(35)
    setCommunity("all")
    setDistrict("all")
    setGotraQuery("")
    setGotraExclude("")
    setKeyword("")
    setVerifiedOnly(false)
  }

  async function handleInterest(profile: PublicProfile) {
    if (!user) {
      toast.info("Please login to send interest.")
      return
    }
    const res = await sendInterestAction(profile.userId)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success(`Interest sent to ${profile.username}`)
  }

  return (
    <>
      <section className="bg-cream py-10 pt-[120px]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-3xl font-bold text-maroon">Matrimonial Search Panel</h1>
            <p className="mt-2 text-muted-foreground">Use filters below to explore verified profiles.</p>
          </div>

          {user && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-full border border-gold bg-white px-4 py-2 text-sm font-bold text-gold">
              <Unlock className="h-4 w-4" />
              Verified Access: Full Gotras Revealed
            </div>
          )}

          <Card className="mb-8 p-6">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-maroon" />
              <h2 className="font-heading text-xl font-bold text-maroon">Filter Matches</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              <FilterGroup label="Looking For">
                <select className="input-style" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="all">All</option>
                  <option value="groom">Groom</option>
                  <option value="bride">Bride</option>
                </select>
              </FilterGroup>

              <FilterGroup label="Age Range">
                <div className="flex items-center gap-2">
                  <Input type="number" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className="min-h-10" />
                  <span className="text-gold">-</span>
                  <Input type="number" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} className="min-h-10" />
                </div>
              </FilterGroup>

              <FilterGroup label="Community">
                <select className="input-style" value={community} onChange={(e) => setCommunity(e.target.value)}>
                  <option value="all">All Communities</option>
                  <option>Mewada</option>
                  <option>Rajput</option>
                </select>
              </FilterGroup>

              <FilterGroup label="District">
                <select className="input-style" value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="all">All Districts</option>
                  <option>Bhopal</option>
                  <option>Sehore</option>
                  <option>Rajgarh</option>
                  <option>Indore</option>
                </select>
              </FilterGroup>

              <FilterGroup label="Search Gotra">
                <Input value={gotraQuery} onChange={(e) => setGotraQuery(e.target.value)} placeholder="E.g. Rathore" />
              </FilterGroup>

              <FilterGroup label="Exclude Gotra">
                <Input value={gotraExclude} onChange={(e) => setGotraExclude(e.target.value)} placeholder="E.g. Mewada" />
              </FilterGroup>

              <FilterGroup label="Profession / Education">
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="E.g. Engineer" />
              </FilterGroup>

              <div className="flex items-end gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-5 w-5 accent-maroon" />
                  <span className="font-semibold text-maroon">Verified Only</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <Button onClick={() => toast.success(`Found ${filtered.length} matches`)}>
                <Search className="mr-2 h-4 w-4" /> Apply Filters
              </Button>
            </div>
          </Card>

          <div className="mb-4 flex items-center justify-between border-b-2 border-gold-light pb-3">
            <h3 className="font-heading text-2xl font-bold text-maroon">Search Results</h3>
            <span className="text-sm font-semibold text-muted-foreground">{filtered.length} matches found</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gold bg-white p-12 text-center">
              <h4 className="font-heading text-xl font-bold text-maroon">No Matches Found</h4>
              <p className="mt-2 text-muted-foreground">Try expanding your search filter criteria.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((profile) => (
                <ProfileCard
                  key={profile.userId}
                  profile={profile}
                  isLoggedIn={!!user}
                  onView={() => setSelected(profile)}
                  onInterest={() => handleInterest(profile)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ProfileModal
        profile={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        isLoggedIn={!!user}
        onSendInterest={() => selected && handleInterest(selected)}
      />
    </>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}
