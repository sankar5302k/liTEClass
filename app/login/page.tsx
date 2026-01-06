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
        (window as any).handleCredentialResponse = handleCredentialResponse;
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600/30 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-md p-8 z-10 mx-4">
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            LiteClass
                        </h1>
                        <p className="text-gray-400 text-sm">
                            The future of seamless virtual learning
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white">Welcome Back!</h2>
                            <p className="text-gray-400 mt-2 text-sm">Sign in to access your classrooms and meetings.</p>
                        </div>

                        <div className="flex justify-center mt-6 pt-4 border-t border-gray-700/50">
                            <div id="buttonDiv" className="w-full flex justify-center"></div>
                        </div>

                    </div>

                    <div className="text-center text-xs text-gray-500 mt-8">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </div>
                </div>
            </div>


            <Script
                src="https://accounts.google.com/gsi/client"
                onLoad={() => {
                    ((window as any).google.accounts.id as any).initialize({
                        client_id: "625686226267-t1su5hijmkv1ilb435fgpl1hrsnsb6fk.apps.googleusercontent.com",
                        callback: handleCredentialResponse
                    });
                    ((window as any).google.accounts.id as any).renderButton(
                        document.getElementById("buttonDiv"),
                        {
                            theme: "filled_black",
                            size: "large",
                            width: "280",
                            shape: "pill",
                            logo_alignment: "left"
                        }
                    );
                }}
            />

        </div>
    );
}
