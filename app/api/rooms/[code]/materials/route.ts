import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Material from '@/models/Material';
import Room from '@/models/Room';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = verifyToken(token);
        if (!user || typeof user === 'string') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userEmail = (user as any).email;

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        await dbConnect();

        const room = await Room.findOne({ code, hostId: userEmail });
        if (!room) {
            return NextResponse.json({ error: 'Unauthorized: You are not the host' }, { status: 403 });
        }


        const buffer = Buffer.from(await file.arrayBuffer());

        const material = await Material.create({
            roomId: code,
            filename: file.name,
            contentType: file.type,
            data: buffer,
            size: file.size,
        });

        return NextResponse.json({
            _id: material._id,
            filename: material.filename,
            size: material.size
        }, { status: 201 });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    try {
        await dbConnect();

        const materials = await Material.find({ roomId: code }).select('-data');
        return NextResponse.json(materials);
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
