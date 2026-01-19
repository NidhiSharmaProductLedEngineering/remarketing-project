import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { SearchBar } from "@/components/marketplace/search-bar";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            ReMarket
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/listings">
              <Button variant="ghost">Browse</Button>
            </Link>
            <Link href="/sell">
              <Button variant="ghost">Sell</Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Buy & Sell Pre-Owned Luxury Items
            <br />
            <span className="text-blue-600">Powered by AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover unique secondhand treasures. AI-powered descriptions,
            smart pricing, and secure local pickup.
          </p>
          
          <SearchBar />
          
          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">Start Selling</Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline">
                Browse Items
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "Clothing", emoji: "👕" },
              { name: "Jewelry", emoji: "💍" },
              { name: "Watches", emoji: "⌚" },
              { name: "Purses", emoji: "👜" },
              { name: "Crockery", emoji: "🍽️" },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/listings?category=${category.name.toUpperCase()}`}
                className="p-6 border rounded-lg hover:shadow-lg transition text-center"
              >
                <div className="text-4xl mb-2">{category.emoji}</div>
                <div className="font-semibold">{category.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Recent Listings</h2>
            <Link href="/listings">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <Suspense fallback={<div>Loading...</div>}>
            <ListingGrid limit={8} />
          </Suspense>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose ReMarket?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
              <p className="text-gray-600">
                Auto-generate descriptions, get price suggestions, and smart
                search capabilities
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Stripe-powered transactions with commission-based pricing
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-2">Local Pickup</h3>
              <p className="text-gray-600">
                Meet locally, inspect items, and complete transactions safely
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 ReMarket. Built with ❤️ by Nidhi Sharma
          </p>
        </div>
      </footer>
    </div>
  );
}
