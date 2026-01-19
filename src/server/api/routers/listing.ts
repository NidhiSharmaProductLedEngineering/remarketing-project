import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  verifiedProcedure,
} from "../trpc";
import {
  generateProductDescription,
  suggestPrice,
  moderateContent,
} from "@/lib/ai/openai";

const createListingSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  price: z.number().positive(),
  category: z.enum([
    "CLOTHING",
    "JEWELRY",
    "WATCHES",
    "PURSES",
    "CROCKERY",
    "ELECTRONICS",
    "FURNITURE",
    "BOOKS",
    "TOYS",
    "SPORTS",
    "OTHER",
  ]),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]),
  images: z.array(z.string().url()).min(1).max(10),
  pickupLocation: z.string().min(5),
  pickupInstructions: z.string().optional(),
  useAIDescription: z.boolean().default(false),
  useAIPricing: z.boolean().default(false),
});

export const listingRouter = createTRPCRouter({
  create: verifiedProcedure
    .input(createListingSchema)
    .mutation(async ({ ctx, input }) => {
      let description = input.description;
      let suggestedPrice = input.price;

      // AI Description Generation
      if (input.useAIDescription) {
        try {
          description = await generateProductDescription({
            title: input.title,
            category: input.category,
            condition: input.condition,
            images: input.images,
          });
        } catch (error) {
          console.error("AI description generation failed:", error);
        }
      }

      // AI Price Suggestion
      if (input.useAIPricing) {
        try {
          suggestedPrice = await suggestPrice({
            category: input.category,
            condition: input.condition,
            title: input.title,
            description,
          });
        } catch (error) {
          console.error("AI price suggestion failed:", error);
        }
      }

      // Content Moderation
      const moderation = await moderateContent({
        title: input.title,
        description,
      });

      const listing = await ctx.db.listing.create({
        data: {
          title: input.title,
          description,
          price: input.price,
          suggestedPrice,
          category: input.category,
          condition: input.condition,
          images: input.images,
          pickupLocation: input.pickupLocation,
          pickupInstructions: input.pickupInstructions,
          aiGenerated: input.useAIDescription,
          aiModerated: true,
          moderationFlags: moderation.flags,
          status: moderation.safe ? "ACTIVE" : "FLAGGED",
          userId: ctx.session.user.id,
          publishedAt: moderation.safe ? new Date() : null,
        },
      });

      // Log content moderation
      if (!moderation.safe) {
        await ctx.db.contentModerationLog.create({
          data: {
            contentType: "listing",
            contentId: listing.id,
            flags: moderation.flags,
            confidence: moderation.confidence,
            action: "flagged",
          },
        });
      }

      return listing;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(5).max(100).optional(),
        description: z.string().min(20).max(2000).optional(),
        price: z.number().positive().optional(),
        status: z
          .enum(["DRAFT", "ACTIVE", "SOLD", "REMOVED"])
          .optional(),
        pickupLocation: z.string().optional(),
        pickupInstructions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.id },
      });

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (listing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, ...data } = input;

      return ctx.db.listing.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.id },
      });

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (listing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.listing.delete({
        where: { id: input.id },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              verified: true,
            },
          },
        },
      });

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Increment views
      await ctx.db.listing.update({
        where: { id: input.id },
        data: { views: { increment: 1 } },
      });

      return listing;
    }),

  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        condition: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["recent", "price_asc", "price_desc"]).default("recent"),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        status: "ACTIVE",
      };

      if (input.category) {
        where.category = input.category;
      }

      if (input.condition) {
        where.condition = input.condition;
      }

      if (input.minPrice || input.maxPrice) {
        where.price = {};
        if (input.minPrice) where.price.gte = input.minPrice;
        if (input.maxPrice) where.price.lte = input.maxPrice;
      }

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const orderBy: any = {};
      switch (input.sortBy) {
        case "price_asc":
          orderBy.price = "asc";
          break;
        case "price_desc":
          orderBy.price = "desc";
          break;
        default:
          orderBy.createdAt = "desc";
      }

      const listings = await ctx.db.listing.findMany({
        where,
        orderBy,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              verified: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (listings.length > input.limit) {
        const nextItem = listings.pop();
        nextCursor = nextItem!.id;
      }

      return {
        listings,
        nextCursor,
      };
    }),

  myListings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.listing.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  generateDescription: verifiedProcedure
    .input(
      z.object({
        title: z.string(),
        category: z.string(),
        condition: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const description = await generateProductDescription({
        title: input.title,
        category: input.category,
        condition: input.condition,
      });

      return { description };
    }),

  getSuggestedPrice: verifiedProcedure
    .input(
      z.object({
        title: z.string(),
        category: z.string(),
        condition: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const price = await suggestPrice(input);

      return { price };
    }),
});
