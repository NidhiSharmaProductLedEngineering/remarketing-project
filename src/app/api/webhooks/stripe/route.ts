import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, handleWebhookEvent } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    const event = await constructWebhookEvent(body, signature);
    const result = await handleWebhookEvent(event);

    // Process different event types
    switch (result.type) {
      case "payment_succeeded":
        const paymentIntent = result.paymentIntent!;
        
        await db.transaction.updateMany({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
          data: {
            status: "PAYMENT_COMPLETED",
          },
        });
        break;

      case "payment_failed":
        const failedIntent = result.paymentIntent!;
        
        await db.transaction.updateMany({
          where: {
            stripePaymentIntentId: failedIntent.id,
          },
          data: {
            status: "CANCELLED",
            cancellationReason: "Payment failed",
          },
        });
        break;

      case "account_updated":
        const account = result.account!;
        
        if (account.charges_enabled && account.payouts_enabled) {
          await db.user.updateMany({
            where: {
              stripeAccountId: account.id,
            },
            data: {
              stripeAccountVerified: true,
            },
          });
        }
        break;

      case "transfer_created":
        // Transfer to connected account successful
        console.log("Transfer created:", result.transfer);
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
