import { useState, useEffect } from "react";

function CodeAnalysis({ socketRef, code }) {
    const [analysis, setAnalysis] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!socketRef.current) return;

        const handleCodeAnalysisResult = (data) => {
            setIsAnalyzing(false);
            if (data.error) {
                setError(data.error);
                setAnalysis([]);
            } else {
                const codeLines = code.split('\n');
                const formattedAnalysis = codeLines.map((line, index) => ({
                    line: line || " ",
                    lineNumber: index + 1,
                    explanation: data.explanations[index] || "No explanation available"
                }));
                setAnalysis(formattedAnalysis);
                setError(null);
            }
        };

        socketRef.current.on('code-analysis-result', handleCodeAnalysisResult);
        
        return () => {
            socketRef.current.off('code-analysis-result', handleCodeAnalysisResult);
        };
    }, [code, socketRef]);

    const analyzeCode = async () => {
        if (!code?.trim()) {
            setError("Please write some code first");
            return;
        }
        
        setError(null);
        setIsAnalyzing(true);
        try {
            // Get roomId from socket connection
            const roomId = socketRef.current._opts.query.roomId;
            
            // Log the code being sent for analysis
            console.log('Sending code for analysis');
            
            // Send code to backend for analysis
            socketRef.current.emit('analyze-code', { roomId, code });
        } catch (error) {
            console.error("Error analyzing code:", error);
            setError("Failed to start analysis: " + error.message);
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-screen overflow-y-auto p-4 bg-background text-white">
            <h2 className="text-xl font-bold mb-4">Code Analysis</h2>
            
            <button 
                onClick={analyzeCode}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
            >
                {isAnalyzing ? "Analyzing..." : "Analyze Code"}
            </button>
            
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="space-y-4">
                {analysis.map((item) => (
                    <div key={item.lineNumber} className="border border-gray-700 p-3 rounded">
                        <div className="flex items-start">
                            <span className="text-gray-400 mr-2 w-8">#{item.lineNumber}</span>
                            <div className="flex-1">
                                <pre className="font-mono text-sm text-green-300 mb-1">{item.line}</pre>
                                <div className="text-gray-300 pl-2 border-l-2 border-gray-600">
                                    {item.explanation}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!analysis.length && !isAnalyzing && !error && (
                <div className="text-gray-400">
                    Click 'Analyze Code' to get line-by-line explanations
                </div>
            )}
        </div>
    );
}

export default CodeAnalysis;
