import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db.ts';
import Room from '../../../../models/Room.ts';
import { verifyToken } from '../../../../lib/auth.ts';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // Verify Authentication
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = verifyToken(token);
        if (!user || typeof user === 'string') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Generate unique code
        let code = Math.random().toString(36).substring(2, 7);
        let exists = await Room.findOne({ code });
        while (exists) {
            code = Math.random().toString(36).substring(2, 7);
            exists = await Room.findOne({ code });
        }

        const room = await Room.create({
            code,
            hostId: (user as any).email,
            active: true
        });

        return NextResponse.json({ code: room.code });

    } catch (error) {
        console.error("Error creating room:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
