import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

export interface Peer {
    id: string;
    stream?: MediaStream;
    pc: RTCPeerConnection;
    isMuted?: boolean;
}

export const useWebRTC = (roomId: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [peers, setPeers] = useState<Peer[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    // Host Control States
    const [waitingStatus, setWaitingStatus] = useState<'joined' | 'waiting' | 'denied'>('joined'); // Default joined until told otherwise
    const [waitingList, setWaitingList] = useState<any[]>([]);
    const [canWriteWb, setCanWriteWb] = useState(false); // Default false until told true (unless host)


    // Poll State
    const [pollState, setPollState] = useState<{
        isActive: boolean;
        question: string;
        options: string[];
        duration: number;
        correctOptionIndex?: number;
        id?: string;
    } | null>(null);

    // ... (rest of hook)

    // ... (rest of hook)

    const [pollResults, setPollResults] = useState<{
        results: number[];
        totalVotes: number;
    } | null>(null);

    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const processingQueue = useRef<{ [key: string]: Promise<void> }>({});
    const candidateQueue = useRef<{ [key: string]: RTCIceCandidateInit[] }>({});
    const myStreamRef = useRef<MediaStream | null>(null);
    const currentUserRef = useRef<any>(null);

    useEffect(() => {

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;


        socketRef.current = io(socketUrl, {
            path: '/socket.io',
            withCredentials: true,
            reconnectionAttempts: 5,
            forceNew: true
        });

        socketRef.current.on('connect', () => {
            console.log("Socket Connected! ID:", socketRef.current?.id);
            if (myStreamRef.current) {
                console.log(`[Client] Emitting join-room ${roomId} (from connect)`);
                socketRef.current?.emit('join-room', { roomId });
                socketRef.current?.emit('get-active-poll', { roomId });
            }
        });

        socketRef.current.on('connect_error', (err) => {
            console.error("Socket Connection Error:", err.message);
        });

        socketRef.current.on('error', (err: any) => {
            console.error("Socket Error Event:", err);
        });

        socketRef.current.on('participants-update', (updatedParticipants: any[]) => {
            console.log('Participants updated:', updatedParticipants);
            setParticipants(updatedParticipants);

            // Auto-detect if I am host or have permissions from list?
            // Actually 'wb-permissions-update' is more reliable for real-time toggle.
            // But initial state can be derived.
            const myId = socketRef.current?.id;
            const me = updatedParticipants.find(p => p.socketId === myId);
            if (me) {
                currentUserRef.current = me.user;
                // If I am showing up in participants list, I have joined.
                setWaitingStatus('joined');
                if (me.canWriteWb !== undefined) setCanWriteWb(me.canWriteWb);
            }

            setPeers(prev => prev.map(p => {
                const participant = updatedParticipants.find(up => up.socketId === p.id);
                if (participant) return { ...p, isMuted: participant.isMuted, user: participant.user };
                return p;
            }));
        });

        // Host Control Events
        socketRef.current.on('waiting-for-approval', () => {
            console.log("In Waiting Room");
            setWaitingStatus('waiting');
        });

        socketRef.current.on('access-granted', () => {
            console.log("Access Granted!");
            setWaitingStatus('joined');
            // Re-join logic might be needed if socket left room channel, 
            // but server logic keeps them in waiting channel until we act?
            // Actually server side: we told client to 'join-room' again? 
            // No, in server 'approve-user' we just updated DB. 
            // But client needs to join socket room 'roomId'.
            // Simplest: Client emits 'join-room' again.
            socketRef.current?.emit('join-room', { roomId });
        });

        socketRef.current.on('access-denied', () => {
            setWaitingStatus('denied');
            socketRef.current?.disconnect();
        });

        socketRef.current.on('wb-permissions-update', ({ canWrite }: { canWrite: boolean }) => {
            console.log("WB Permission:", canWrite);
            setCanWriteWb(canWrite);
        });

        socketRef.current.on('force-mute', () => {
            // Mute myself
            if (myStreamRef.current) {
                const track = myStreamRef.current.getAudioTracks()[0];
                if (track && track.enabled) {
                    track.enabled = false;
                    setIsMuted(true);
                    // Notify server I am muted (ACK)
                    socketRef.current?.emit('toggle-mute', { roomId, isMuted: true });
                }
            }
        });

        socketRef.current.on('kicked', () => {
            alert("You have been kicked from the meeting.");
            window.location.href = '/';
        });

        socketRef.current.on('waiting-list-update', (list: any[]) => {
            setWaitingList(list);
        });

        socketRef.current.on('user-toggled-mute', ({ socketId, isMuted }: { socketId: string, isMuted: boolean }) => {
            setPeers(prev => prev.map(p => p.id === socketId ? { ...p, isMuted } : p));
            setParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, isMuted } : p));
        });

        socketRef.current.on('user-connected', ({ userId, user }: { userId: string, user: any }) => {
            console.log('User connected event:', userId, user?.email);

            const stream = myStreamRef.current;
            if (stream) {
                const pc = createPeerConnection(userId, stream, true);
                peersRef.current[userId] = pc;
                setPeers((prev) => {
                    if (prev.find(p => p.id === userId)) return prev;
                    return [...prev, { id: userId, pc, user }];
                });
            } else {
                console.warn("No local stream available for user-connected", userId);
            }
        });

        socketRef.current.on('signal', async ({ signal, callerID }: { signal: any, callerID: string }) => {
            console.log(`[WebRTC] Received signal from ${callerID} type=${signal.type || 'candidate'}`);

            const processSignal = async () => {
                let stream = myStreamRef.current;
                if (!stream) {
                    console.warn("No local stream for processSignal");
                    return;
                }

                let pc = peersRef.current[callerID];

                if (!pc) {
                    pc = createPeerConnection(callerID, stream, false);
                    peersRef.current[callerID] = pc;
                    setPeers((prev) => {
                        if (prev.find(p => p.id === callerID)) return prev;
                        return [...prev, { id: callerID, pc }];
                    });
                }

                if (signal.type === 'offer') {
                    if (pc.signalingState !== "stable" && pc.signalingState !== "have-remote-offer") {
                        console.warn("Ignoring offer in state", pc.signalingState);
                        return;
                    }
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal));


                        if (candidateQueue.current[callerID]) {
                            for (const candidate of candidateQueue.current[callerID]) {
                                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                            }
                            delete candidateQueue.current[callerID];
                        }

                        const answer = await pc.createAnswer();
                        if (answer.sdp) {
                            answer.sdp = preferCodec(answer.sdp, 'opus');
                        }
                        await pc.setLocalDescription(answer);
                        socketRef.current?.emit('signal', {
                            target: callerID,
                            signal: pc.localDescription,
                            callerID: socketRef.current?.id
                        });
                    } catch (err) {
                        console.error("Error processing offer", err);
                    }
                } else if (signal.type === 'answer') {
                    if (pc.signalingState === "stable") {
                        console.warn("Ignoring answer in stable state");
                        return;
                    }
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal));
                        if (candidateQueue.current[callerID]) {
                            for (const candidate of candidateQueue.current[callerID]) {
                                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                            }
                            delete candidateQueue.current[callerID];
                        }
                    } catch (err) {
                        console.error("Error setting remote answer", err);
                    }
                } else if (signal.candidate) {
                    try {
                        if (pc.remoteDescription) {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        } else {
                            if (!candidateQueue.current[callerID]) {
                                candidateQueue.current[callerID] = [];
                            }
                            candidateQueue.current[callerID].push(signal.candidate);
                        }
                    } catch (e: any) {
                        if (!e.message.includes('ufrag')) console.error("Error adding ice candidate", e);
                    }
                }
            };

            const currentPromise = processingQueue.current[callerID] || Promise.resolve();
            const nextPromise = currentPromise.then(processSignal).catch(e => console.error("Signal Queue Error", e));
            processingQueue.current[callerID] = nextPromise;
        });

        socketRef.current.on('user-disconnected', (userId: string) => {
            if (peersRef.current[userId]) {
                peersRef.current[userId].close();
                delete peersRef.current[userId];
                setPeers((prev) => prev.filter(p => p.id !== userId));
            }
        });

        socketRef.current?.on('meeting-ended', () => {
            alert("Meeting ended by host");
            window.location.href = '/';
        });

        // Poll listeners
        socketRef.current.on('poll-started', (data: any) => {
            console.log("Poll started", data);
            setPollState({ ...data, isActive: true });
            setPollResults(null);
        });

        socketRef.current.on('poll-ended', (data: any) => {
            console.log("Poll ended", data);
            setPollState(prev => prev ? { ...prev, isActive: false } : null);
            setPollResults(data);
        });

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone access blocked. Browser requires a Secure Context (HTTPS or localhost).");
            console.error("navigator.mediaDevices is undefined.");
            return;
        }

        console.log("Requesting microphone with high quality constraints...");
        navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
                channelCount: 2
            },
            video: false
        })
            .then((stream) => {
                console.log("Mic granted");
                setMyStream(stream);
                myStreamRef.current = stream;

                if (socketRef.current?.connected) {
                    console.log(`[Client] Emitting join-room ${roomId} (from getUserMedia)`);
                    socketRef.current.emit('join-room', { roomId });
                    socketRef.current.emit('get-active-poll', { roomId });
                }
            })
            .catch(err => {
                console.error("Error accessing audio", err);
                alert("Could not access microphone. Please allow permissions.");
            });

        return () => {
            socketRef.current?.disconnect();
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
            }
            Object.values(peersRef.current).forEach(pc => pc.close());
        };
    }, [roomId]);

    const createPeerConnection = (targetId: string, stream: MediaStream, initiator: boolean) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach(track => {
            console.log(`[WebRTC] Adding local track ${track.kind} to PC for ${targetId}`);
            pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC] Generated Candidate for ${targetId}:`, event.candidate.candidate);
                socketRef.current?.emit('signal', {
                    target: targetId,
                    signal: { candidate: event.candidate },
                    callerID: socketRef.current?.id
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE Connection State (${targetId}):`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
                console.error(`[WebRTC] Connection failed with ${targetId}, restarting ice?`);
                pc.restartIce();
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection State (${targetId}):`, pc.connectionState);
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received Track from ${targetId}:`, event.streams[0].id, event.streams[0].getTracks().length);
            setPeers(prev => prev.map(p => {
                if (p.id === targetId) {
                    return { ...p, stream: event.streams[0] };
                }
                return p;
            }));
        };

        if (initiator) {
            pc.createOffer().then(offer => {
                if (offer.sdp) {
                    offer.sdp = preferCodec(offer.sdp, 'opus');
                }
                pc.setLocalDescription(offer);
                socketRef.current?.emit('signal', {
                    target: targetId,
                    signal: offer,
                    callerID: socketRef.current?.id
                });
            });
        }

        return pc;
    };

    const toggleMute = () => {
        if (myStream) {
            const track = myStream.getAudioTracks()[0];
            track.enabled = !track.enabled;
            const newMutedState = !track.enabled;
            setIsMuted(newMutedState);
            socketRef.current?.emit('toggle-mute', { roomId, isMuted: newMutedState });
        }
    };

    const endMeeting = () => {
        socketRef.current?.emit('end-meeting', { roomId });
    };

    const sendReaction = (reaction: string) => {
        console.log("sending ", reaction);
        socketRef.current?.emit('send-reaction', { roomId, reaction });
    };

    const createPoll = (question: string, options: string[], duration: number, correctOptionIndex: number) => {
        socketRef.current?.emit('create-poll', { roomId, question, options, duration, correctOptionIndex });
    };

    const submitVote = (optionIndex: number) => {
        if (!pollState?.id) return;
        socketRef.current?.emit('submit-vote', { pollId: pollState.id, optionIndex });
    };

    const [lastReaction, setLastReaction] = useState<{ socketId: string, reaction: string, user?: any } | null>(null);

    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on('reaction-received', (data: { socketId: string, reaction: string, user?: any }) => {
            setLastReaction(data);
            setTimeout(() => setLastReaction(null), 3000);
        });

        return () => {
            socketRef.current?.off('reaction-received');
        }
    }, [roomId]);


    const clearPollResults = () => setPollResults(null);

    // Host Actions
    const approveUser = (email: string) => {
        socketRef.current?.emit('host-action', { action: 'approve-user', roomId, targetEmail: email });
    };
    const denyUser = (email: string) => {
        socketRef.current?.emit('host-action', { action: 'deny-user', roomId, targetEmail: email });
    };
    const kickUser = (email: string, socketId?: string) => {
        socketRef.current?.emit('host-action', { action: 'kick-user', roomId, targetEmail: email, targetId: socketId });
    };
    const toggleWbAccess = (email: string) => {
        socketRef.current?.emit('host-action', { action: 'toggle-wb-access', roomId, targetEmail: email });
    };
    const remoteMute = (socketId: string) => {
        socketRef.current?.emit('host-action', { action: 'mute-user', roomId, targetId: socketId });
    };

    return {
        peers, participants, myStream, toggleMute, isMuted, endMeeting, socket: socketRef.current, sendReaction, lastReaction,
        pollState, pollResults, createPoll, submitVote, clearPollResults,
        waitingStatus, waitingList, canWriteWb,
        hostActions: { approveUser, denyUser, kickUser, toggleWbAccess, remoteMute }
    };
};

const preferCodec = (sdp: string, codec: string) => {
    const sdpLines = sdp.split('\r\n');
    const mLineIndex = sdpLines.findIndex(line => line.startsWith('m=audio'));
    if (mLineIndex === -1) return sdp;

    const mLine = sdpLines[mLineIndex];
    const elements = mLine.split(' ');

    const getPayloadType = (lines: string[], codecName: string) => {
        const pattern = new RegExp(`a=rtpmap:(\\d+) ${codecName}/`, 'i');
        for (const line of lines) {
            const match = line.match(pattern);
            if (match && match[1]) return match[1];
        }
        return null;
    };

    const pt = getPayloadType(sdpLines, codec);
    if (!pt) return sdp;

    const newMLine = [elements[0], elements[1], elements[2]].concat(
        [pt],
        elements.slice(3).filter(p => p !== pt)
    ).join(' ');

    sdpLines[mLineIndex] = newMLine;
    return sdpLines.join('\r\n');
};
