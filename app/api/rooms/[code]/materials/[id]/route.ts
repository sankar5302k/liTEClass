import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Material from '@/models/Material';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string, id: string }> }) {
    const { id } = await params;
    try {
        await dbConnect();
        const material = await Material.findById(id);
        if (!material) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return new NextResponse(material.data, {
            headers: {
                'Content-Type': material.contentType,
                'Content-Disposition': `inline; filename="${material.filename}"`,
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
