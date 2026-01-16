import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0F172A] text-white overflow-hidden relative">
            {/* Background gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    LiteClass
                </h1>
                <Link
                    href="/login"
                    className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-sm font-semibold transition-all hover:border-gray-500"
                >
                    Login
                </Link>
            </nav>

            <main className="relative z-10 container mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 flex flex-col items-center text-center">

                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                        The Future of <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                            Low-Bandwidth Learning
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Experience seamless audio classrooms, real-time whiteboards, and instant material sharing without the need for high-speed internet.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Link
                            href="/login"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1"
                        >
                            Get Started
                        </Link>
                        <a
                            href="#features"
                            className="px-8 py-4 bg-gray-800/50 hover:bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 rounded-full font-bold text-lg transition-all backdrop-blur-sm"
                        >
                            Learn More
                        </a>
                    </div>
                </div>

                {/* Screenshot Showcase */}
                <div id="features" className="mt-32 w-full max-w-7xl mx-auto space-y-32">

                    {/* Feature 1: Real-time Interaction */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6 text-left">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold">Classroom Engagement</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Interact with students in real-time. See who is speaking, who invited whom, and manage the classroom effectively.
                            </p>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-50 group-hover:opacity-75 blur transition duration-200"></div>
                            <img
                                src="/screenshots/chat_people.png"
                                alt="Classroom Interface"
                                className="relative rounded-xl shadow-2xl border border-gray-700 w-full transform group-hover:scale-[1.01] transition duration-300"
                            />
                        </div>
                    </div>

                    {/* Feature 2: Collaborative Whiteboard */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                        <div className="flex-1 space-y-6 text-left md:text-right">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center text-purple-400 ml-auto lg:ml-auto md:ml-auto">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold">Interactive Whiteboard</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Draw, explain, and collaborate. The synchronized whiteboard ensures everyone sees the same concept at the same time, perfect for math, diagrams, and brainstorming.
                            </p>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-50 group-hover:opacity-75 blur transition duration-200"></div>
                            <img
                                src="/screenshots/whiteboard_view.png"
                                alt="Whiteboard"
                                className="relative rounded-xl shadow-2xl border border-gray-700 w-full transform group-hover:scale-[1.01] transition duration-300"
                            />
                        </div>
                    </div>

                    {/* Feature 3: Instant Polling - Redesigned Step-by-Step */}
                    <div className="space-y-16">
                        <div className="text-left space-y-4">
                            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center text-green-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold">Instant Feedback Loop</h3>
                            <p className="text-gray-400 text-lg max-w-2xl">
                                Gauge understanding in seconds. From creation to analysis, the polling system is designed for speed.
                            </p>
                        </div>

                        <div className="space-y-12">
                            {/* Step 1: Create */}
                            <div className="bg-gray-800/30 p-8 rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition duration-300">
                                <div className="flex flex-col lg:flex-row items-center gap-8">
                                    <div className="flex-1 space-y-4 text-left">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-400 font-bold text-xl border border-green-500/20">1</div>
                                        <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">Create & Launch</h4>
                                        <p className="text-gray-400 text-lg leading-relaxed">
                                            Setup polls in regular chat flow. Open the poll creator, type your question and options, and launch it to the class instantly.
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-green-400/80">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>Simple Interface</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="relative overflow-hidden rounded-xl border border-gray-700 shadow-2xl bg-[#0F172A]">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-transparent pointer-events-none"></div>
                                            <img src="/screenshots/create_poll.png" className="w-full h-auto" alt="Create Poll Interface" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Vote */}
                            <div className="bg-gray-800/30 p-8 rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition duration-300">
                                <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                                    <div className="flex-1 space-y-4 text-left lg:text-right">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xl border border-blue-500/20 md:ml-auto">2</div>
                                        <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Instant Voting</h4>
                                        <p className="text-gray-400 text-lg leading-relaxed">
                                            Students receive a non-intrusive popup to cast their vote. One tap participation ensures high engagement rates without disrupting the lecture.
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-blue-400/80 justify-start lg:justify-end">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            <span>Mobile Optimized</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="relative overflow-hidden rounded-xl border border-gray-700 shadow-2xl bg-[#0F172A]">
                                            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 to-transparent pointer-events-none"></div>
                                            <img src="/screenshots/answer_poll.png" className="w-full h-auto" alt="Student Voting Interface" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Analyze */}
                            <div className="bg-gray-800/30 p-8 rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition duration-300">
                                <div className="flex flex-col lg:flex-row items-center gap-8">
                                    <div className="flex-1 space-y-4 text-left">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xl border border-purple-500/20">3</div>
                                        <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Real-time Analysis</h4>
                                        <p className="text-gray-400 text-lg leading-relaxed">
                                            Watch results update in real-time. Share the findings with the class or keep them private to gauge understanding before moving on.
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-purple-400/80">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                            <span>Live Data</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="relative overflow-hidden rounded-xl border border-gray-700 shadow-2xl bg-[#0F172A]">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none"></div>
                                            <img src="/screenshots/poll_result.png" className="w-full h-auto" alt="Poll Results Analytics" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 4: Host Controls & Materials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition">
                            <h4 className="text-2xl font-bold mb-4">Powerful Host Controls</h4>
                            <p className="text-gray-400 mb-6">Manage entry with a waiting room, mute participants, or remove disruptions with a single click.</p>
                            <img src="/screenshots/host_controls.png" className="rounded-xl shadow-lg w-full" alt="Host Controls" />
                        </div>
                        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition">
                            <h4 className="text-2xl font-bold mb-4">Seamless Material Sharing</h4>
                            <p className="text-gray-400 mb-6">Uploaded materials are instantly available to all students for the duration of the class.</p>
                            <img src="/screenshots/material_sharing.png" className="rounded-xl shadow-lg w-full" alt="Material Sharing" />
                        </div>
                    </div>

                    {/* Feature 5: Mobile Experience */}
                    <div className="py-16">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-5xl font-bold mb-4">Classroom in Your Pocket</h3>
                            <p className="text-gray-400 max-w-2xl mx-auto">Fully optimized for mobile devices so students can learn from anywhere.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4">
                            <div className="group space-y-3">
                                <div className="overflow-hidden rounded-2xl border-4 border-gray-800 shadow-2xl">
                                    <img src="/screenshots/mobile_meet.png" className="w-full h-auto transform group-hover:scale-105 transition duration-500" alt="Mobile Meet" />
                                </div>
                                <p className="text-center text-sm font-medium text-gray-400">Join</p>
                            </div>
                            <div className="group space-y-3">
                                <div className="overflow-hidden rounded-2xl border-4 border-gray-800 shadow-2xl">
                                    <img src="/screenshots/mobile_chat.png" className="w-full h-auto transform group-hover:scale-105 transition duration-500" alt="Mobile Chat" />
                                </div>
                                <p className="text-center text-sm font-medium text-gray-400">Chat</p>
                            </div>
                            <div className="group space-y-3">
                                <div className="overflow-hidden rounded-2xl border-4 border-gray-800 shadow-2xl">
                                    <img src="/screenshots/mobile_whiteboard.png" className="w-full h-auto transform group-hover:scale-105 transition duration-500" alt="Mobile Whiteboard" />
                                </div>
                                <p className="text-center text-sm font-medium text-gray-400">Draw</p>
                            </div>
                            <div className="group space-y-3">
                                <div className="overflow-hidden rounded-2xl border-4 border-gray-800 shadow-2xl">
                                    <img src="/screenshots/mobile_material.png" className="w-full h-auto transform group-hover:scale-105 transition duration-500" alt="Mobile Material" />
                                </div>
                                <p className="text-center text-sm font-medium text-gray-400">Read</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div id="features" className="mt-32 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
                    <div className="space-y-6">
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Designed for Efficiency
                        </h3>
                        <p className="text-gray-400 text-lg">
                            Traditional video classrooms consume gigabytes of data. LiteClass minimizes bandwidth usage by focusing on high-quality audio and static content sharing, making education accessible everywhere.
                        </p>
                        <ul className="space-y-4">
                            {['Works on 2G/3G networks', 'No video track overhead', 'Ephemeral data privacy', 'Mobile-first design'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1 rounded-2xl shadow-2xl">
                        <div className="bg-[#0F172A] rounded-xl overflow-hidden relative flex items-center justify-center group">
                            <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/0 transition duration-500"></div>
                            <img
                                src="/screenshots/start_page.png"
                                alt="Start Page Interface"
                                className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition duration-500"
                            />
                        </div>
                    </div>
                </div>

            </main>

            <footer className="w-full border-t border-gray-800 py-8 bg-[#0F172A]">
                <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} LiteClass. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
