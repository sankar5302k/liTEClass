import { useState, useEffect } from 'react';

interface PollOverlayProps {
    isHost: boolean;
    showCreation?: boolean;
    onCloseCreation?: () => void;
    pollState: {
        isActive: boolean;
        question: string;
        options: string[];
        duration: number; // remaining
        correctOptionIndex?: number;
        id?: string;
    } | null;
    pollResults: {
        results: number[];
        totalVotes: number;
        correctOptionIndex?: number; // Backend should ideally pass this, or we rely on pollState if persisted? Server sends it in poll-ended
    } | null;
    onCreatePoll: (question: string, options: string[], duration: number, correctOptionIndex: number) => void;
    onVote: (optionIndex: number) => void;
    onCloseResults: () => void;
}

export default function PollOverlay({ isHost, showCreation, onCloseCreation, pollState, pollResults, onCreatePoll, onVote, onCloseResults }: PollOverlayProps) {
    // Creation State
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [duration, setDuration] = useState<number | ''>(30);
    const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

    // Voting State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    // Sync timer
    useEffect(() => {
        if (pollState?.isActive) {
            setTimeLeft(Math.floor(pollState.duration));
            const timer = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setHasVoted(false);
            setSelectedOption(null);
        }
    }, [pollState]);

    const handleCreateOption = () => setOptions([...options, '']);
    const handleRemoveOption = (idx: number) => {
        setOptions(options.filter((_, i) => i !== idx));
        if (correctOptionIndex === idx) setCorrectOptionIndex(0);
        else if (correctOptionIndex > idx) setCorrectOptionIndex(prev => prev - 1);
    };
    const handleOptionChange = (idx: number, val: string) => {
        const newOptions = [...options];
        newOptions[idx] = val;
        setOptions(newOptions);
    };

    const submitPoll = () => {
        if (!question || options.some(o => !o.trim())) return;
        const finalDuration = typeof duration === 'string' ? parseInt(duration) || 30 : duration;
        onCreatePoll(question, options, finalDuration, correctOptionIndex);
        onCloseCreation?.();
        // Reset form
        setQuestion('');
        setOptions(['', '']);
        setDuration(30);
        setCorrectOptionIndex(0);
    };

    if (showCreation && isHost) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                    <button onClick={onCloseCreation} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                    <h2 className="text-xl font-bold text-white mb-4">Create Poll</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Question</label>
                            <input
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                className="w-full bg-gray-800 rounded-lg p-3 text-white border border-white/10 focus:border-blue-500 outline-none"
                                placeholder="e.g. Who is the founder of liteclass?"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Options</label>
                            {options.map((opt, i) => (
                                <div key={i} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="radio"
                                        name="correctOption"
                                        checked={correctOptionIndex === i}
                                        onChange={() => setCorrectOptionIndex(i)}
                                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 mr-2 cursor-pointer"
                                        title="Mark as correct answer"
                                    />
                                    <input
                                        value={opt}
                                        onChange={e => handleOptionChange(i, e.target.value)}
                                        className={`flex-1 bg-gray-800 rounded-lg p-2 text-sm text-white border ${correctOptionIndex === i ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-white/10'}`}
                                        placeholder={`e.g. Option ${i + 1}`}
                                    />
                                    {options.length > 2 && (
                                        <button onClick={() => handleRemoveOption(i)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                                    )}
                                </div>
                            ))}
                            <button onClick={handleCreateOption} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">+ Add Option</button>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Duration (seconds)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="w-24 bg-gray-800 rounded-lg p-2 text-white border border-white/10"
                                min="10"
                                max="300"
                            />
                        </div>

                        <button
                            onClick={submitPoll}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-600/20"
                        >
                            Start Poll
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active Poll View (For Students & Host)
    if (pollState?.isActive) {
        return (
            <div className="fixed bottom-24 right-4 md:right-8 z-[90] w-full max-w-sm animate-in slide-in-from-bottom-10 duration-300">
                <div
                    className="bg-gray-900/95 backdrop-blur-xl border border-blue-500/30 p-5 rounded-2xl shadow-2xl relative overflow-hidden"
                >
                    {/* Progress Bar for Timer */}
                    <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / pollState.duration) * 100}%` }} />

                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Live Poll</span>
                        <span className="text-xs text-gray-400 font-mono">{timeLeft}s remaining</span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-4 leading-tight">{pollState.question}</h3>

                    <div className="space-y-2">
                        {pollState.options.map((opt, i) => {
                            let selectionStatusClass = '';
                            if (hasVoted && selectedOption === i) {
                                if (pollState.correctOptionIndex !== undefined) {
                                    selectionStatusClass = i === pollState.correctOptionIndex
                                        ? 'bg-green-600 border-green-500 text-white shadow-lg'
                                        : 'bg-red-600 border-red-500 text-white shadow-lg';
                                } else {
                                    selectionStatusClass = 'bg-blue-600 border-blue-500 text-white shadow-lg';
                                }
                            } else if (hasVoted && pollState.correctOptionIndex === i) {
                                selectionStatusClass = 'bg-green-600/50 border-green-500/50 text-white'; // Show correct answer if they missed it
                            }
                            else {
                                selectionStatusClass = 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10';
                            }

                            return (
                                <button
                                    key={i}
                                    disabled={hasVoted || isHost}
                                    onClick={() => {
                                        setSelectedOption(i);
                                        setHasVoted(true);
                                        onVote(i);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl text-sm transition-all border ${selectionStatusClass} ${hasVoted || isHost ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                    {hasVoted && (
                        <div className="mt-3 text-center">
                            {pollState.correctOptionIndex !== undefined && selectedOption !== null ? (
                                selectedOption === pollState.correctOptionIndex ? (
                                    <p className="text-sm font-bold text-green-400 animate-bounce">Correct Answer!</p>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <p className="text-sm font-bold text-red-400 animate-pulse mb-1">Wrong Answer!</p>
                                        <p className="text-xs text-gray-300">The correct answer is: <span className="font-bold text-green-400">{pollState.options[pollState.correctOptionIndex]}</span></p>
                                    </div>
                                )
                            ) : (
                                <p className="text-xs text-gray-500 animate-pulse">Waiting for results...</p>
                            )}
                        </div>
                    )}
                    {isHost && <p className="text-center text-xs text-gray-500 mt-3">You typically cannot vote as host</p>}
                </div>
            </div>
        );
    }

    // Results View
    if (pollResults) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div
                    className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
                >
                    <button onClick={onCloseResults} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                    <h2 className="text-xl font-bold text-white mb-2">Poll Results</h2>
                    <p className="text-sm text-gray-400 mb-6">Total Votes: {pollResults.totalVotes}</p>

                    <div className="space-y-4">
                        {pollResults.results.map((count, i) => {
                            const isCorrect = pollResults.correctOptionIndex === i;
                            return (
                                <div key={i} className="relative">
                                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                                        <span className={isCorrect ? "text-green-400 font-bold flex items-center gap-1" : ""}>
                                            {isCorrect && "✅ "} Option {i + 1}
                                        </span>
                                        <span>{count} votes ({pollResults.totalVotes > 0 ? Math.round((count / pollResults.totalVotes) * 100) : 0}%)</span>
                                    </div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${pollResults.totalVotes > 0 ? (count / pollResults.totalVotes) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
