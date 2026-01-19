import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, verifiedProcedure } from "../trpc";
import {
  createPaymentIntent,
  calculateTransactionBreakdown,
} from "@/lib/stripe";

export const transactionRouter = createTRPCRouter({
  create: verifiedProcedure
    .input(
      z.object({
        listingId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.listingId },
        include: { user: true },
      });

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }

      if (listing.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing is not available",
        });
      }

      if (listing.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot buy your own listing",
        });
      }

      if (!listing.user.stripeAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seller has not set up payments",
        });
      }

      // Convert price to paise (INR minor units)
      const amountInPaise = Math.round(listing.price * 100);

      const { paymentIntent, commission, sellerPayout } =
        await createPaymentIntent({
          amount: amountInPaise,
          sellerId: listing.userId,
          stripeAccountId: listing.user.stripeAccountId,
          listingId: listing.id,
          buyerId: ctx.session.user.id,
        });

      const transaction = await ctx.db.transaction.create({
        data: {
          listingId: listing.id,
          buyerId: ctx.session.user.id,
          sellerId: listing.userId,
          amount: listing.price,
          commission: commission / 100,
          sellerPayout: sellerPayout / 100,
          stripePaymentIntentId: paymentIntent.id,
          status: "PENDING",
        },
      });

      return {
        transaction,
        clientSecret: paymentIntent.client_secret,
      };
    }),

  confirm: verifiedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        pickupScheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findUnique({
        where: { id: input.transactionId },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (transaction.buyerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.transaction.update({
        where: { id: input.transactionId },
        data: {
          status: "PAYMENT_COMPLETED",
          pickupScheduledAt: input.pickupScheduledAt,
        },
      });
    }),

  markPickupComplete: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findUnique({
        where: { id: input.transactionId },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (
        transaction.buyerId !== ctx.session.user.id &&
        transaction.sellerId !== ctx.session.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updated = await ctx.db.transaction.update({
        where: { id: input.transactionId },
        data: {
          status: "COMPLETED",
          pickupCompletedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // Mark listing as sold
      await ctx.db.listing.update({
        where: { id: transaction.listingId },
        data: {
          status: "SOLD",
          soldAt: new Date(),
        },
      });

      return updated;
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findUnique({
        where: { id: input.transactionId },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (
        transaction.buyerId !== ctx.session.user.id &&
        transaction.sellerId !== ctx.session.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.transaction.update({
        where: { id: input.transactionId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });
    }),

  myTransactions: protectedProcedure.query(async ({ ctx }) => {
    const [purchases, sales] = await Promise.all([
      ctx.db.transaction.findMany({
        where: { buyerId: ctx.session.user.id },
        include: {
          listing: true,
          seller: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.transaction.findMany({
        where: { sellerId: ctx.session.user.id },
        include: {
          listing: true,
          buyer: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { purchases, sales };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findUnique({
        where: { id: input.id },
        include: {
          listing: true,
          buyer: {
            select: { id: true, name: true, image: true, email: true },
          },
          seller: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (
        transaction.buyerId !== ctx.session.user.id &&
        transaction.sellerId !== ctx.session.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return transaction;
    }),

  calculateBreakdown: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .query(({ input }) => {
      return calculateTransactionBreakdown(Math.round(input.amount * 100));
    }),
});
