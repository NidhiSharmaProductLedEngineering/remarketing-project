import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

const COMMISSION_PERCENTAGE = parseFloat(
  process.env.STRIPE_COMMISSION_PERCENTAGE || "10"
);

/**
 * Create a Stripe Connect Express account for a seller
 */
export async function createConnectAccount(userId: string, email: string) {
  const account = await stripe.accounts.create({
    type: "express",
    country: "IN",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      userId,
    },
  });

  return account;
}

/**
 * Create an account link for onboarding
 */
export async function createAccountLink(accountId: string, returnUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return accountLink;
}

/**
 * Create a payment intent with application fee (commission)
 */
export async function createPaymentIntent(params: {
  amount: number; // in paise (INR minor units)
  sellerId: string;
  stripeAccountId: string;
  listingId: string;
  buyerId: string;
}) {
  const { amount, stripeAccountId, listingId, buyerId } = params;

  const applicationFeeAmount = Math.round((amount * COMMISSION_PERCENTAGE) / 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "inr",
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: stripeAccountId,
    },
    metadata: {
      listingId,
      buyerId,
    },
  });

  return {
    paymentIntent,
    commission: applicationFeeAmount,
    sellerPayout: amount - applicationFeeAmount,
  };
}

/**
 * Confirm payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
  return paymentIntent;
}

/**
 * Retrieve payment intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

/**
 * Create a refund
 */
export async function createRefund(paymentIntentId: string, reason?: string) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: reason as Stripe.RefundCreateParams.Reason,
  });

  return refund;
}

/**
 * Get account status
 */
export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  
  return {
    isComplete: account.details_submitted,
    isVerified: account.charges_enabled && account.payouts_enabled,
    requirements: account.requirements,
  };
}

/**
 * Create login link for existing connected accounts
 */
export async function createLoginLink(accountId: string) {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink;
}

/**
 * Calculate transaction breakdown
 */
export function calculateTransactionBreakdown(totalAmount: number) {
  const commission = Math.round((totalAmount * COMMISSION_PERCENTAGE) / 100);
  const sellerPayout = totalAmount - commission;

  return {
    totalAmount,
    commission,
    sellerPayout,
    commissionPercentage: COMMISSION_PERCENTAGE,
  };
}

/**
 * Construct webhook event
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );

  return event;
}

/**
 * Handle webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      // Handle successful payment
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return { type: "payment_succeeded", paymentIntent };

    case "payment_intent.payment_failed":
      // Handle failed payment
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      return { type: "payment_failed", paymentIntent: failedIntent };

    case "account.updated":
      // Handle account updates
      const account = event.data.object as Stripe.Account;
      return { type: "account_updated", account };

    case "transfer.created":
      // Handle transfer to connected account
      const transfer = event.data.object as Stripe.Transfer;
      return { type: "transfer_created", transfer };

    default:
      return { type: "unhandled", event };
  }
}
