import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";

function AIReview({ socketRef, code }) {
    const [review, setReview] = useState(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!socketRef.current) return;

        const handleCodeReviewResult = (data) => {
            setIsReviewing(false);
            if (data.error) {
                setError(data.error);
                setReview(null);
            } else {
                setReview(data.review);
                setError(null);
            }
        };

        socketRef.current.on('code-review-result', handleCodeReviewResult);
        
        return () => {
            socketRef.current.off('code-review-result', handleCodeReviewResult);
        };
    }, [socketRef]);

    const reviewCode = async () => {
        if (!code?.trim()) {
            setError("Please write some code first");
            return;
        }
        
        setError(null);
        setIsReviewing(true);
        try {
            const roomId = socketRef.current._opts.query.roomId;
            console.log('Sending code for review, length:', code.length);
            socketRef.current.emit('review-code', { roomId, code });
        } catch (error) {
            console.error("Error reviewing code:", error);
            setError("Failed to start code review: " + error.message);
            setIsReviewing(false);
        }
    };

    return (
        <div className="h-screen overflow-y-auto p-4 bg-background text-white">
            <h2 className="text-xl font-bold mb-4">AI Code Review</h2>
            
            <button 
                onClick={reviewCode}
                disabled={isReviewing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
            >
                {isReviewing ? (
                    <span className="flex items-center">
                        <FaSpinner className="animate-spin mr-2" /> Reviewing...
                    </span>
                ) : "Review Code"}
            </button>
            
            {error && <div className="text-red-500 mb-4">{error}</div>}

            {review && (
                <div className="space-y-4">
                    <div className="border border-gray-700 p-4 rounded">
                        <h3 className="text-lg font-semibold mb-2 text-green-400">Summary</h3>
                        <p className="text-gray-300">{review.summary}</p>
                    </div>
                    
                    {review.strengths.length > 0 && (
                        <div className="border border-gray-700 p-4 rounded">
                            <h3 className="text-lg font-semibold mb-2 text-green-400">Strengths</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {review.strengths.map((strength, index) => (
                                    <li key={index} className="text-gray-300">{strength}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {review.improvements.length > 0 && (
                        <div className="border border-gray-700 p-4 rounded">
                            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Suggested Improvements</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {review.improvements.map((improvement, index) => (
                                    <li key={index} className="text-gray-300">{improvement}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {review.bestPractices.length > 0 && (
                        <div className="border border-gray-700 p-4 rounded">
                            <h3 className="text-lg font-semibold mb-2 text-blue-400">Best Practices</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {review.bestPractices.map((practice, index) => (
                                    <li key={index} className="text-gray-300">{practice}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {!review && !isReviewing && !error && (
                <div className="text-gray-400">
                    Click 'Review Code' to get a comprehensive AI analysis of your code including strengths, 
                    suggested improvements, and best practices.
                </div>
            )}
        </div>
    );
}

export default AIReview;