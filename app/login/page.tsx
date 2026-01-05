'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleCredentialResponse = async (response: any) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential: response.credential }),
            });

            if (res.ok) {
                router.push('/');
            } else {
                console.error('Login failed');
            }
        } catch (e) {
            console.error('Error:', e);
        }
    };

    useEffect(() => {
        // @ts-ignore
        window.handleCredentialResponse = handleCredentialResponse;
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center">Welcome back</h1>
                <p className="text-center text-gray-400">Sign in to continue to LiteClass</p>

                <div className="flex justify-center mt-6">
                    <div id="buttonDiv"></div>
                </div>
            </div>

            <Script
                src="https://accounts.google.com/gsi/client"
                onLoad={() => {
                    // @ts-ignore
                    google.accounts.id.initialize({
                        client_id: "625686226267-t1su5hijmkv1ilb435fgpl1hrsnsb6fk.apps.googleusercontent.com",
                        callback: handleCredentialResponse
                    });
                    // @ts-ignore
                    google.accounts.id.renderButton(
                        document.getElementById("buttonDiv"),
                        { theme: "outline", size: "large", width: "100%" }
                    );
                }}
            />
        </div>
    );
}
