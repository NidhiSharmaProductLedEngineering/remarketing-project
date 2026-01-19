import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create test users
  const password = await hash("password123", 12);

  const user1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Johnson",
      password,
      verified: true,
      verifiedAt: new Date(),
      bio: "Fashion enthusiast selling vintage finds",
      location: "Mumbai, India",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Smith",
      password,
      verified: true,
      verifiedAt: new Date(),
      bio: "Collector of rare watches and jewelry",
      location: "Delhi, India",
    },
  });

  console.log("✅ Created test users");

  // Create sample listings
  const listings = [
    {
      title: "Vintage Leather Jacket",
      description:
        "Classic brown leather jacket in excellent condition. Genuine leather, well-maintained, perfect for winter. Size L.",
      price: 4500,
      category: "CLOTHING",
      condition: "GOOD",
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5",
      ],
      pickupLocation: "Bandra, Mumbai",
      status: "ACTIVE",
      publishedAt: new Date(),
      userId: user1.id,
    },
    {
      title: "Diamond Stud Earrings",
      description:
        "Beautiful 14K white gold diamond earrings. 0.5 carat total weight. Comes with original certificate.",
      price: 15000,
      category: "JEWELRY",
      condition: "LIKE_NEW",
      images: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908",
      ],
      pickupLocation: "Connaught Place, Delhi",
      status: "ACTIVE",
      publishedAt: new Date(),
      userId: user2.id,
    },
    {
      title: "Vintage Rolex Submariner Homage",
      description:
        "Automatic watch with sapphire crystal. Excellent condition, keeps perfect time. Great vintage piece.",
      price: 8000,
      category: "WATCHES",
      condition: "GOOD",
      images: [
        "https://images.unsplash.com/photo-1587836374826-e6ec5b89ad78",
      ],
      pickupLocation: "Whitefield, Bangalore",
      status: "ACTIVE",
      publishedAt: new Date(),
      userId: user2.id,
    },
    {
      title: "Designer Leather Purse",
      description:
        "Authentic designer handbag. Black leather, gold hardware. Minor wear on corners but overall great condition.",
      price: 12000,
      category: "PURSES",
      condition: "GOOD",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
      ],
      pickupLocation: "Jubilee Hills, Hyderabad",
      status: "ACTIVE",
      publishedAt: new Date(),
      userId: user1.id,
    },
    {
      title: "Fine China Dinner Set",
      description:
        "Complete 24-piece dinner set. White porcelain with gold trim. Includes plates, bowls, cups. Like new!",
      price: 6000,
      category: "CROCKERY",
      condition: "LIKE_NEW",
      images: [
        "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61",
      ],
      pickupLocation: "Koramangala, Bangalore",
      status: "ACTIVE",
      publishedAt: new Date(),
      userId: user1.id,
    },
    {
      title: "Vintage Denim Jacket",
      description:
        "Classic blue denim jacket from the 90s. Authentic vintage piece with unique patina. Size M.",
      price: 3000,
      category: "CLOTHING",
      condition: "FAIR",
      images: [
        "https://images.unsplash.com/photo-1576995853123-5a10305d93c0",
      ],
      pickupLocation: "Indiranagar, Bangalore",
      status: "ACTIVE",
      publishedAt: new Date(),
      userId: user2.id,
    },
  ];

  for (const listing of listings) {
    await prisma.listing.create({
      data: listing,
    });
  }

  console.log("✅ Created sample listings");

  // Create sample reviews
  const completedTransaction = await prisma.transaction.create({
    data: {
      listingId: (await prisma.listing.findFirst({ where: { userId: user1.id } }))!.id,
      buyerId: user2.id,
      sellerId: user1.id,
      amount: 4500,
      commission: 450,
      sellerPayout: 4050,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await prisma.review.create({
    data: {
      transactionId: completedTransaction.id,
      reviewerId: user2.id,
      reviewedUserId: user1.id,
      rating: 5,
      comment: "Great seller! Item exactly as described. Quick pickup.",
    },
  });

  console.log("✅ Created sample review");

  console.log("🎉 Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
