"use client";

import { trpc } from "@/lib/trpc";

interface ListingGridProps {
  limit?: number;
  category?: string;
}

export function ListingGrid({ limit = 20, category }: ListingGridProps) {
  const { data, isLoading } = trpc.listing.list.useQuery({
    limit,
    category,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2" />
            <div className="bg-gray-200 h-4 rounded mb-2" />
            <div className="bg-gray-200 h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.listings.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No listings found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.listings.map((listing) => (
        <a
          key={listing.id}
          href={`/listings/${listing.id}`}
          className="group"
        >
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
            {listing.images[0] && (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            )}
          </div>
          <h3 className="font-semibold group-hover:text-blue-600 transition">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-600">{listing.category}</p>
          <p className="font-bold mt-1">₹{listing.price.toLocaleString()}</p>
        </a>
      ))}
    </div>
  );
}
