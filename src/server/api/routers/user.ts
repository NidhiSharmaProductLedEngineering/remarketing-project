import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createConnectAccount,
  createAccountLink,
  getAccountStatus,
} from "@/lib/stripe";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const hashedPassword = await hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
      });

      return { success: true, userId: user.id };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        bio: true,
        location: true,
        verified: true,
        verifiedAt: true,
        stripeAccountId: true,
        stripeAccountVerified: true,
        joinedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        bio: z.string().max(500).optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  requestVerification: protectedProcedure
    .input(
      z.object({
        documentUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          verificationDocument: input.documentUrl,
        },
      });
    }),

  setupStripeAccount: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      let accountId = user.stripeAccountId;

      // Create account if it doesn't exist
      if (!accountId) {
        const account = await createConnectAccount(user.id, user.email!);
        accountId = account.id;

        await ctx.db.user.update({
          where: { id: user.id },
          data: { stripeAccountId: accountId },
        });
      }

      // Create onboarding link
      const accountLink = await createAccountLink(accountId, input.returnUrl);

      return { url: accountLink.url };
    }),

  checkStripeAccountStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    });

    if (!user?.stripeAccountId) {
      return { hasAccount: false, isVerified: false };
    }

    const status = await getAccountStatus(user.stripeAccountId);

    // Update local verification status
    if (status.isVerified && !user.stripeAccountVerified) {
      await ctx.db.user.update({
        where: { id: user.id },
        data: { stripeAccountVerified: true },
      });
    }

    return {
      hasAccount: true,
      isVerified: status.isVerified,
      requirements: status.requirements,
    };
  }),

  getPublicProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          location: true,
          verified: true,
          joinedAt: true,
          listings: {
            where: { status: "ACTIVE" },
            take: 10,
            orderBy: { createdAt: "desc" },
          },
          reviewsReceived: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              reviewer: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Calculate average rating
      const avgRating =
        user.reviewsReceived.length > 0
          ? user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) /
            user.reviewsReceived.length
          : 0;

      return {
        ...user,
        averageRating: avgRating,
        totalReviews: user.reviewsReceived.length,
      };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalListings, activeListing, soldListings, totalSales, totalPurchases] =
      await Promise.all([
        ctx.db.listing.count({
          where: { userId: ctx.session.user.id },
        }),
        ctx.db.listing.count({
          where: { userId: ctx.session.user.id, status: "ACTIVE" },
        }),
        ctx.db.listing.count({
          where: { userId: ctx.session.user.id, status: "SOLD" },
        }),
        ctx.db.transaction.count({
          where: { sellerId: ctx.session.user.id, status: "COMPLETED" },
        }),
        ctx.db.transaction.count({
          where: { buyerId: ctx.session.user.id, status: "COMPLETED" },
        }),
      ]);

    return {
      totalListings,
      activeListing,
      soldListings,
      totalSales,
      totalPurchases,
    };
  }),
});
