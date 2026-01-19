import { SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "remarket",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new NextjsSite(stack, "site", {
        customDomain: {
          domainName: process.env.DOMAIN_NAME || undefined,
          hostedZone: process.env.HOSTED_ZONE || undefined,
        },
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
          STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
          STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY!,
          STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
          STRIPE_COMMISSION_PERCENTAGE: process.env.STRIPE_COMMISSION_PERCENTAGE || "10",
          OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
          UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET || "",
          UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID || "",
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
          NEXT_PUBLIC_APP_NAME: "ReMarket",
        },
      });

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
