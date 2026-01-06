import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

const client = new OAuth2Client(process.env.AUTH_GOOGLE_ID);

export async function POST(req: NextRequest) {
    try {
        const { credential } = await req.json();

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.AUTH_GOOGLE_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        const { email, name, picture } = payload;

        await dbConnect();

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ email, name, picture });
        } else {
            user.name = name;
            user.picture = picture;
            await user.save();
        }

        const token = signToken({ email, name, picture, id: user._id });

        const response = NextResponse.json({ success: true, user: { email, name, picture } });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}