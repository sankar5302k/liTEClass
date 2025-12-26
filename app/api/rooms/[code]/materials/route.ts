import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Material from '@/models/Material';
import Room from '@/models/Room';


// App router doesn't use config for bodyParser like Pages router. 
// It handles FormData automatically.

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const hostId = formData.get('hostId') as string | null;

        if (!file || !hostId) {
            return NextResponse.json({ error: 'Missing file or hostId' }, { status: 400 });
        }

        await dbConnect();
        const room = await Room.findOne({ code, hostId });
        if (!room) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Convert file to Buffer
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
        // Return list of materials (without data)
        const materials = await Material.find({ roomId: code }).select('-data');
        return NextResponse.json(materials);
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
