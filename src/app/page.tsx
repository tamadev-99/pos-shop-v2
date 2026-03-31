import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Store, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  ArrowRight,
  ShoppingBag,
  Package,
  Layers
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TamaPOS | The Ultimate Multi-Tenant SaaS POS System",
  description: "Manage your retail business with ease. Supports Clothing Stores, Mini Marts, and more with multi-tenant architecture and employee PIN security.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              T
            </div>
            <span className="text-xl font-bold tracking-tight">Tama<span className="text-indigo-500">POS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#industries" className="hover:text-white transition-colors">Industries</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <Badge variant="outline" className="mb-6 border-indigo-500/30 bg-indigo-500/5 text-indigo-400 py-1.5 px-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            Next-Gen Multi-Tenant POS
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-500 animate-in fade-in slide-in-from-bottom-10 duration-700">
            One Platform.<br />Unlimited Businesses.
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000">
            The complete SaaS POS solution designed for modern retailers. Manage multiple stores, employee permissions, and real-time inventory in one sleek dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-lg font-semibold group shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
                Join Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 relative border-t border-slate-900 bg-slate-950/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Scale</h2>
            <p className="text-slate-400">Streamlined tools for the modern entrepreneur.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Multi-Tenancy",
                desc: "Run multiple independent stores under one main account with full data isolation.",
                icon: Layers,
                color: "text-blue-500",
                bg: "bg-blue-500/10"
              },
              {
                title: "Employee Profiles",
                desc: "Secure 6-digit PIN access for every staff member with granular permission controls.",
                icon: Users,
                color: "text-indigo-500",
                bg: "bg-indigo-500/10"
              },
              {
                title: "Audit Logging",
                desc: "Track every action, from sales to stock adjustments, tied to specific employee profiles.",
                icon: ShieldCheck,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10"
              },
              {
                title: "Advanced Analytics",
                desc: "Visualized performance data across all your stores to help you make informed decisions.",
                icon: BarChart3,
                color: "text-amber-500",
                bg: "bg-amber-500/10"
              }
            ].map((feature, i) => (
              <Card key={i} className="p-8 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all group hover:-translate-y-2">
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-8">Tailored for Your Industry</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                TamaPOS isn't just a generic checkout tool. We've built industry-specific logic to ensure your workflow is seamless, no matter what you sell.
              </p>
              <ul className="space-y-4">
                {[
                  "Clothing Store: Size & Color variants, seasonal trends.",
                  "Mini Mart: Barcode scanning & Expiry date tracking.",
                  "F&B: Table management and guest orders (Soon).",
                  "Service: Appointment and staff booking (Soon)."
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-12 h-12 text-indigo-400 mb-4" />
                <h4 className="text-lg font-bold">Clothing Store</h4>
              </div>
              <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex flex-col items-center justify-center text-center mt-12">
                <Store className="w-12 h-12 text-emerald-400 mb-4" />
                <h4 className="text-lg font-bold">Mini Mart</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="relative p-12 md:p-20 rounded-[40px] bg-indigo-600 overflow-hidden text-center group">
            <div className="absolute top-0 left-0 w-full h-full bg-slate-950/20 hover:bg-slate-950/10 transition-colors pointer-events-none" />
            <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">Start Your Journey with TamaPOS</h2>
            <p className="text-indigo-100 text-xl mb-10 max-w-xl mx-auto relative z-10 leading-relaxed">
              Join thousands of business owners who trust TamaPOS to run their operations daily.
            </p>
            <Link href="/register" className="relative z-10 inline-block">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-50 font-bold px-12 h-16 text-lg rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95">
                Register Your Store Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs">T</div>
            <span className="font-bold">TamaPOS</span>
          </div>
          <p>© 2026 TamaPOS SaaS. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
