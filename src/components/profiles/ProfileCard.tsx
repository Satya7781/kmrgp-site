"use client"

import Image from "next/image"
import { MapPin, Calendar, Ruler, Eye, Heart, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { PublicProfile } from "@/types"

interface ProfileCardProps {
  profile: PublicProfile
  isLoggedIn: boolean
  onView: () => void
  onInterest: () => void
}

export function ProfileCard({ profile, isLoggedIn, onView, onInterest }: ProfileCardProps) {
  return (
    <Card className="overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-64 cursor-pointer" onClick={onView}>
        <Image
          src={profile.imageUrl || `/images/${profile.username?.split(" ")[0].toLowerCase()}.jpeg`}
          alt={profile.username || ""}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute left-3 top-3 rounded-full bg-saffron px-3 py-1 text-xs font-bold text-white">
          {profile.type === "GROOM" ? "Groom" : "Bride"}
        </div>
        {profile.visible && profile.approvalStatus === "APPROVED" && (
          <div className="absolute right-3 top-3 rounded-full bg-maroon px-3 py-1 text-xs font-bold text-white">
            Verified
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="mb-2 font-heading text-xl font-bold text-maroon">{profile.username}</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-cream-dark px-2 py-1 text-xs font-semibold text-maroon">
            <Calendar className="h-3 w-3" /> {profile.age ?? "-"} yrs
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-cream-dark px-2 py-1 text-xs font-semibold text-maroon">
            <Ruler className="h-3 w-3" /> {profile.height}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-cream-dark px-2 py-1 text-xs font-semibold text-maroon">
            <MapPin className="h-3 w-3" /> {profile.district}
          </span>
        </div>

        <table className="mb-3 w-full text-sm">
          <tbody>
            <tr>
              <td className="font-semibold text-maroon">Education:</td>
              <td className="text-right text-muted-foreground">{profile.education}</td>
            </tr>
            <tr>
              <td className="font-semibold text-maroon">Profession:</td>
              <td className="text-right text-muted-foreground">{profile.profession}</td>
            </tr>
            <tr>
              <td className="font-semibold text-maroon">Community:</td>
              <td className="text-right text-muted-foreground">{profile.community}</td>
            </tr>
          </tbody>
        </table>

        {!isLoggedIn && (
          <p className="mb-3 text-center text-xs font-semibold italic text-saffron">🔒 Gotra & contact details hidden</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onView}>
            <Eye className="mr-1 h-4 w-4" /> View
          </Button>
          <Button className="flex-1" onClick={onInterest}>
            {isLoggedIn ? (
              <><Heart className="mr-1 h-4 w-4" /> Interest</>
            ) : (
              <><Lock className="mr-1 h-4 w-4" /> Unlock</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
