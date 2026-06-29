import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Landmark, ShieldCheck, Users, Lock, Sparkles } from "lucide-react"
import { listApprovedProfiles } from "@/lib/services/profileService"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const featured = (await listApprovedProfiles()).slice(0, 3)

  return (
    <>
      <Header />
      <main className="pt-[76px]">
        {/* Hero */}
        <section className="relative flex min-h-[700px] items-center justify-center bg-cover bg-center px-6 py-24"
          style={{ backgroundImage: "url('/images/ram_sita_vivah.png')" }}
        >
          <div className="absolute inset-0 bg-maroon/70" />
          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
              Exclusively for Kshatriya Mewada Rajput Families
            </div>

            <h1 className="mb-6 font-heading text-4xl font-extrabold leading-tight text-white md:text-6xl">
              Where Sacred Lineage Meets Lifelong Union
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-cream-dark">
              India&apos;s most trusted matrimony community for Mewada & Rajput families — built on Gotra verification, elder oversight, and timeless values.
            </p>

            <div className="mb-10 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Gotra Verified</span>
              <span className="text-gold">•</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Elder Approved</span>
              <span className="text-gold">•</span>
              <span className="flex items-center gap-1"><Lock className="h-4 w-4" /> 100% Private</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/profiles"><Search className="h-5 w-5" /> Browse Verified Profiles</Link>
              </Button>
              <Button variant="gold" asChild size="lg">
                <Link href="#legacy"><Landmark className="h-5 w-5" /> Explore Our Legacy</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatBox number="8,500+" label="Verified Profiles" />
              <StatBox number="1,200+" label="Successful Unions" />
              <StatBox number="10,000+" label="Trusted Families" />
              <StatBox number="15+" label="Years of Service" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-cream-dark py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-6 md:grid-cols-5">
              <Step num="01" title="Register Your Family" desc="Submit gotra details and family background for review." />
              <div className="hidden text-center text-2xl text-gold md:block">→</div>
              <Step num="02" title="Get Elder Verified" desc="Community elders cross-check lineage using Vanshavali records." />
              <div className="hidden text-center text-2xl text-gold md:block">→</div>
              <Step num="03" title="Connect with Dignity" desc="Browse verified profiles and connect with families sharing your values." />
            </div>
          </div>
        </section>

        {/* Legacy */}
        <section id="legacy" className="bg-maroon py-20 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 md:flex-row">
            <div className="flex-1">
              <div className="mb-4 text-4xl">🏛️</div>
              <h2 className="mb-4 font-heading text-3xl font-bold text-white">The Pride of Mewar — Our Living Heritage</h2>
              <p className="leading-relaxed text-cream-dark">
                Our roots trace back to Maharana Pratap — the eternal symbol of Rajput courage and sacrifice. This platform honours that legacy by ensuring every union is formed within verified clans, upholding the sacred code of bravery, respect, and tradition.
              </p>
              <div className="my-6 flex items-center justify-center gap-4 text-gold">
                <span className="h-px w-20 bg-gradient-to-r from-transparent to-gold" />
                <span>❋</span>
                <span className="h-px w-20 bg-gradient-to-l from-transparent to-gold" />
              </div>
            </div>
            <div className="flex-1">
              <Image src="/images/maharana_pratap.png" alt="Maharana Pratap" width={500} height={400} className="rounded-2xl border-4 border-gold shadow-2xl" />
            </div>
          </div>
        </section>

        {/* Featured profiles */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-saffron">
                <span className="h-px w-6 bg-saffron" /> Featured Profiles
                <span className="h-px w-6 bg-saffron" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-maroon">Meet Verified Mewada & Rajput Matches</h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Explore a preview of verified active profiles from our community.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((profile) => (
                <Card key={profile.userId} className="overflow-hidden">
                  <div className="relative h-64">
                    <Image
                      src={profile.imageUrl || `/images/${profile.username?.split(" ")[0].toLowerCase()}.jpeg`}
                      alt={profile.username || ""}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-saffron px-3 py-1 text-xs font-bold text-white">{profile.type}</div>
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-maroon px-3 py-1 text-xs font-bold text-white">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="mb-2 font-heading text-xl font-bold text-maroon">{profile.username}</h3>
                    <p className="mb-1 text-sm text-muted-foreground">{profile.age} yrs • {profile.height}</p>
                    <p className="mb-1 text-sm"><span className="font-semibold text-maroon">Gotra:</span> {profile.gotraSelf}</p>
                    <p className="mb-4 text-sm"><span className="font-semibold text-maroon">Education:</span> {profile.education}</p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/profiles">View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-gradient-to-br from-saffron to-maroon py-16 text-white">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="mb-10 font-heading text-3xl font-bold text-white">Our Rajput Values</h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              <ValueCard emoji="⚔️" hi="वीरता" en="Veerta (Bravery)" />
              <ValueCard emoji="🙏" hi="सम्मान" en="Samman (Respect)" />
              <ValueCard emoji="🤝" hi="विश्वास" en="Vishwas (Trust)" />
              <ValueCard emoji="🏛️" hi="परम्परा" en="Parampara (Tradition)" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-cream py-20">
          <div className="mx-auto max-w-4xl rounded-3xl border-4 border-double border-maroon bg-white p-10 text-center shadow-lg">
            <h2 className="mb-4 font-heading text-3xl font-bold text-maroon">Ready to Find Your Life Partner?</h2>
            <p className="mb-8 text-muted-foreground">Join thousands of Rajput families who have already found their perfect match through our trusted platform.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/profiles"><Search className="h-5 w-5" /> Browse Profiles Now</Link>
              </Button>
              <Button variant="gold" size="lg">
                <Sparkles className="h-5 w-5" /> Create Free Profile
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function StatBox({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gold-light bg-white/10 p-4 backdrop-blur-sm">
      <div className="font-heading text-3xl font-bold text-gold">{number}</div>
      <div className="text-sm text-cream-dark">{label}</div>
    </div>
  )
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gold-light bg-white p-6 shadow-sm">
      <div className="mb-3 font-heading text-2xl font-bold text-saffron">{num}</div>
      <h3 className="mb-2 font-heading text-lg font-bold text-maroon">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function ValueCard({ emoji, hi, en }: { emoji: string; hi: string; en: string }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 p-6 backdrop-blur-sm">
      <div className="mb-2 text-4xl">{emoji}</div>
      <div className="font-heading text-xl font-bold">{hi}</div>
      <div className="text-sm text-cream-dark">{en}</div>
    </div>
  )
}
