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
}

export const useWebRTC = (roomId: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [peers, setPeers] = useState<Peer[]>([]);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const processingQueue = useRef<{ [key: string]: Promise<void> }>({}); // Mutex for signaling
    const candidateQueue = useRef<{ [key: string]: RTCIceCandidateInit[] }>({}); // Queue for ICE candidates

    useEffect(() => {
        const hostId = localStorage.getItem('hostId');

        socketRef.current = io({
            path: '/socket.io',
        });

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone access blocked. Browser requires a Secure Context (HTTPS or localhost). If testing on mobile, you MUST use HTTPS.");
            console.error("navigator.mediaDevices is undefined. Insecure context?");
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then((stream) => {
                setMyStream(stream);

                socketRef.current?.emit('join-room', { roomId, hostId });

                socketRef.current?.on('user-connected', ({ userId }: { userId: string }) => {
                    console.log('User connected:', userId);
                    const pc = createPeerConnection(userId, stream, true);
                    peersRef.current[userId] = pc;
                    setPeers((prev) => {
                        if (prev.find(p => p.id === userId)) return prev;
                        return [...prev, { id: userId, pc }];
                    });
                });

                socketRef.current?.on('signal', async ({ signal, callerID }: { signal: any, callerID: string }) => {
                    // Chain operations to prevent race conditions (InvalidStateError)
                    const processSignal = async () => {
                        let pc = peersRef.current[callerID];

                        // Create PC if it doesn't exist (incoming call)
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
                                // Ignore offer if we are not stable.
                                console.warn("Ignoring offer in state", pc.signalingState);
                                return;
                            }

                            try {
                                await pc.setRemoteDescription(new RTCSessionDescription(signal));

                                // Process queued candidates
                                if (candidateQueue.current[callerID]) {
                                    for (const candidate of candidateQueue.current[callerID]) {
                                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                                    }
                                    delete candidateQueue.current[callerID];
                                }

                                const answer = await pc.createAnswer();
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
                                // Process queued candidates
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
                                    // Queue candidate
                                    if (!candidateQueue.current[callerID]) {
                                        candidateQueue.current[callerID] = [];
                                    }
                                    candidateQueue.current[callerID].push(signal.candidate);
                                }
                            } catch (e: any) {
                                if (e.message.includes('ufrag')) {
                                    // Benign operation error during negotiation
                                    console.debug("Ignored benign WebRTC error:", e.message);
                                } else {
                                    console.error("Error adding ice candidate", e);
                                }
                            }
                        }
                    };

                    // Add to queue
                    const currentPromise = processingQueue.current[callerID] || Promise.resolve();
                    const nextPromise = currentPromise.then(processSignal).catch(e => console.error("Signal Queue Error", e));
                    processingQueue.current[callerID] = nextPromise;
                });

                socketRef.current?.on('user-disconnected', (userId: string) => {
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

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

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
            setIsMuted(!track.enabled);
        }
    };

    const endMeeting = () => {
        const hostId = localStorage.getItem('hostId');
        socketRef.current?.emit('end-meeting', { roomId, hostId });
    };

    return { peers, myStream, toggleMute, isMuted, endMeeting, socket: socketRef.current };
};
