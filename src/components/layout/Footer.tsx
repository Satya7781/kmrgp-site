import Link from "next/link"
import { MapPin, Phone, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t-4 border-gold bg-maroon text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gold bg-gradient-to-br from-saffron to-maroon font-heading text-xl font-extrabold">
                K
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold text-gold">Kshatriya Mewada</span>
                <span className="text-[10.5px] font-bold uppercase tracking-widest">Rajput Parivar</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-cream-dark">
              A dedicated family matrimony portal preserving heritage and building relationships based on values, trust, and tradition.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-bold text-gold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-gold">Home</Link></li>
              <li><Link href="/profiles" className="hover:text-gold">Partner Search</Link></li>
              <li><Link href="/dashboard" className="hover:text-gold">My Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-bold text-gold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-pointer hover:text-gold">Help Center</span></li>
              <li><span className="cursor-pointer hover:text-gold">Privacy Policy</span></li>
              <li><span className="cursor-pointer hover:text-gold">Terms of Service</span></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-bold text-gold">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>Mewar Heritage Center, Phanda, Bhopal, Madhya Pradesh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" />
                <span>+91 62672 82908</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                <span>pramodrajput0214@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gold-light pt-8 text-center">
          <div className="rajput-border mb-6" />
          <p className="mb-2 font-heading text-lg font-bold text-gold">Jai Mewar • Jai Kshatriya • Jai Rajputana</p>
          <p className="text-sm text-cream-dark">© 2026 Kshatriya Mewada Rajput Parivar. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
