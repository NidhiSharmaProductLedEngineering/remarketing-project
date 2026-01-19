import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeRevenue } from '@/server/api/revenue-analytics';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (add admin field to your User model)
    // const user = await prisma.user.findUnique({
    //   where: { id: session.user.id }
    // });
    // if (!user?.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // allow empty/invalid JSON; treat as no filters
    }

    const category =
      typeof (body as any)?.category === 'string' ? (body as any).category : undefined;

    const result = await analyzeRevenue(category);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Revenue analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze revenue' },
      { status: 500 }
    );
  }
}