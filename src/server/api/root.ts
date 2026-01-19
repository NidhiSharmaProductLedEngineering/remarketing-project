import { createTRPCRouter } from "./trpc";
import { listingRouter } from "./routers/listing";
import { transactionRouter } from "./routers/transaction";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  listing: listingRouter,
  transaction: transactionRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
