import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();


        let code = '';
        let exists = true;
        while (exists) {
            code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
            const existing = await Room.findOne({ code });
            if (!existing) exists = false;
        }

        const hostId = crypto.randomUUID();

        const room = await Room.create({
            code,
            hostId,
        });

        return NextResponse.json({ code: room.code, hostId: room.hostId }, { status: 201 });
    } catch (error) {
        console.error('Create room error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
