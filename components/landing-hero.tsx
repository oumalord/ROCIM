import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export function LandingHero() {
  return (
    <div className="min-h-screen">
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image src="/images/ministry-group.png" alt="ROCIM Ministry Group" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-serif">REVEALERS OF CHRIST</h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-orange-400 mb-2">INTERNATIONAL MINISTRY</h2>
          <p className="text-xl text-orange-300 mb-8 font-medium tracking-wider">(ROCIM)</p>
          <div className="mb-12 max-w-2xl mx-auto">
            <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-4">
              "For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes"
            </blockquote>
            <cite className="text-orange-300 text-lg font-semibold">Romans 1:16</cite>
          </div>
          <div className="space-y-4">
            <p className="text-lg text-white/90 mb-6">Join our ministry community and be part of God's work</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get Started - Register Now
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Member Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


