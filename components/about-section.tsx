"use client"

import { Clock, MapPin, Phone } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Timings",
    description: "-",
    detail: "Please contact us for today's timings",
  },
  {
    icon: MapPin,
    title: "Location",
    description: "Vanjipalayam main road, Avinashi",
    detail: "Pudupalayam, Tamil Nadu 641663",
  },
  {
    icon: Phone,
    title: "Contact",
    description: "09843386594",
    detail: "Call or WhatsApp for orders and features",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden aspect-[4/5]">
                  <img
                    src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80"
                    alt="Restaurant interior"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden aspect-square">
                  <img
                    src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80"
                    alt="Chef preparing dish"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden aspect-square">
                  <img
                    src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80"
                    alt="Fine dining experience"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden aspect-[4/5]">
                  <img
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80"
                    alt="Signature cocktail"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
            
            {/* Floating accent */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          </div>

          {/* Content */}
          <div>
            <p className="text-primary text-sm tracking-[0.3em] uppercase mb-4">
              About Us
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              Booster Chaya, Avinashi
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 text-pretty">
              Booster Chaya brings a premium cafe vibe with a wide range of frappies,
              boba, Korean snacks, mojitos, and signature hot beverages for every mood.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10 text-pretty">
              Located on Vanjipalayam main road in Avinashi, we focus on flavor, quality,
              and quick service with options for both vegetarian and non-vegetarian guests.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors duration-300"
                >
                  <div className="p-3 rounded-xl bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                    <p className="text-muted-foreground/70 text-sm">
                      {feature.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
