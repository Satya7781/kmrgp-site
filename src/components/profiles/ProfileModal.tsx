"use client"

import Image from "next/image"
import { Phone, Lock, ShieldCheck, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { PublicProfile } from "@/types"

interface ProfileModalProps {
  profile: PublicProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoggedIn: boolean
  onSendInterest?: () => void
}

export function ProfileModal({ profile, open, onOpenChange, isLoggedIn, onSendInterest }: ProfileModalProps) {
  if (!profile) return null

  const hasContact = isLoggedIn && profile.contact && profile.contact !== "-"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="sr-only">{profile.username}</DialogTitle>
        <DialogDescription className="sr-only">Profile details for {profile.username}</DialogDescription>

        <div className="flex flex-col gap-6 md:flex-row">
          <div className="relative mx-auto h-48 w-48 shrink-0 md:mx-0">
            <Image
              src={profile.imageUrl || `/images/${profile.username?.split(" ")[0].toLowerCase()}.jpeg`}
              alt={profile.username || ""}
              fill
              className="rounded-2xl border-4 border-gold object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-2xl font-bold text-maroon">{profile.username}</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-maroon px-3 py-1 text-xs font-bold text-white">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
              <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-bold text-maroon">{profile.type}</span>
              <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-bold text-maroon">{profile.community}</span>
            </div>

            <table className="w-full text-sm">
              <tbody className="divide-y divide-gold-light">
                <Row label="Age / Height" value={`${profile.age ?? "-"} yrs, ${profile.height}`} />
                <Row label="Education" value={profile.education} />
                <Row label="Profession" value={profile.profession} />
                <Row label="District" value={profile.district} />
                {isLoggedIn ? (
                  <>
                    <Row label="Gotra (Self)" value={profile.gotraSelf} />
                    <Row label="Gotra (Mother)" value={profile.gotraMother} />
                    <Row label="Father" value={profile.fatherName} />
                    <Row label="Mother" value={profile.motherName} />
                    <Row label="Family Type" value={profile.familyType} />
                    <Row label="Brothers" value={profile.brothers} />
                    <Row label="Sisters" value={profile.sisters} />
                    <Row label="Parents Occupation" value={profile.parentsOccupation} />
                    <Row label="Address" value={profile.address} />
                  </>
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4">
                      <div className="flex items-center gap-3 rounded-xl bg-cream-dark p-4 text-maroon">
                        <Lock className="h-5 w-5" />
                        <div>
                          <div className="font-bold">Restricted Access</div>
                          <div className="text-xs">Login to view full Gotra and family details.</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-5">
              {isLoggedIn ? (
                hasContact ? (
                  <a href={`tel:+91${profile.contact}`} className="flex items-center gap-3 rounded-xl bg-saffron/10 p-4 text-maroon">
                    <Phone className="h-5 w-5 text-saffron" />
                    <div>
                      <div className="text-xs font-bold text-muted-foreground">Contact Number</div>
                      <div className="font-bold">+91 {profile.contact}</div>
                    </div>
                  </a>
                ) : (
                  <div className="rounded-xl bg-cream-dark p-4 text-sm text-muted-foreground">No contact number available.</div>
                )
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-cream-dark p-4 text-maroon">
                  <Lock className="h-5 w-5" />
                  <div>
                    <div className="font-bold">Contact Hidden</div>
                    <div className="text-xs">Login to reveal contact details.</div>
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn && onSendInterest && (
              <Button className="mt-5 w-full" onClick={onSendInterest}>
                <Phone className="mr-2 h-4 w-4" /> Send Marriage Interest
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <tr>
      <td className="py-2 font-semibold text-maroon">{label}</td>
      <td className="py-2 text-right text-muted-foreground">{value || "-"}</td>
    </tr>
  )
}
