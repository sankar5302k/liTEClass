import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {

    const { code } = await params;
    try {
        await dbConnect();
        const room = await Room.findOne({ code, active: true });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({ active: true }, { status: 200 });
    } catch (error) {
        console.error('Verify room error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
