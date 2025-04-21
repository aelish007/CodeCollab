// backend/index.js
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ACTIONS = require("./Actions");
require("dotenv").config();

// Initialize Gemini AI with gemini-2.0-flash model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Using gemini-2.0-flash model

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Setup storage and upload directory
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Endpoint for file uploads
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: "File upload failed" });
    }
    res.status(200).send({
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
    });
});

// Serve static files from the uploads folder
app.use("/uploads", express.static(uploadFolder));

const userSocketMap = {};
const roomData = {};
const userPresence = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => ({
        socketId,
        username: userSocketMap[socketId],
    }));
}

function generateTimeStamp() {
    const currentTime = new Date();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const amOrPm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    return `${formattedHours}:${formattedMinutes} ${amOrPm}`;
}

// Helper function to parse AI response - optimized for gemini-2.0-flash model
async function analyzeCodeWithGemini(code) {
    // Validate input
    if (!code || typeof code !== 'string') {
        throw new Error('Invalid code input');
    }
    
    const codeLines = code.split('\n');
    if (codeLines.length === 0) {
        throw new Error('Empty code provided');
    }
    
    try {
        // Structured prompt for gemini-2.0-flash model
        const prompt = `Analyze this code line by line and provide a brief explanation for each line.
        
        Code to analyze:
        ${code}
        
        Please format your response as a simple list with line numbers, like:
        Line 1: Explanation
        Line 2: Explanation
        And so on.`;

        console.log('Sending code to Gemini API for analysis...');
        
        // Using the new API format for gemini-2.0-flash
        const result = await model.generateContent({
            contents: [{
                parts: [{ text: prompt }]
            }]
        });
        
        if (!result || !result.response) {
            throw new Error('Empty response from Gemini API');
        }
        
        const responseText = result.response.text();
        console.log('Received response from Gemini API');

        // Extract explanations using a more flexible approach for free version
        let explanations = [];
        try {
            // Try to parse line by line with more flexible pattern matching
            const lines = responseText.split('\n');
            for (const line of lines) {
                // Match patterns like "Line X:" or "X:" or "Line X -"
                const lineMatch = line.match(/(?:Line\s*)?([0-9]+)\s*[:\-]\s*(.+)/i);
                if (lineMatch) {
                    const lineNum = parseInt(lineMatch[1]) - 1; // Convert to 0-indexed
                    if (!isNaN(lineNum) && lineNum >= 0 && lineNum < codeLines.length) {
                        explanations[lineNum] = lineMatch[2].trim();
                    }
                }
            }
            
            // If we couldn't parse any explanations, try a different approach
            if (explanations.length === 0) {
                console.log('Could not parse line-by-line explanations, trying alternative parsing method');
                // Just split the response into roughly equal parts for each line
                const chunks = responseText.split('\n\n');
                if (chunks.length > 0 && codeLines.length > 0) {
                    // Distribute explanations across code lines
                    for (let i = 0; i < codeLines.length; i++) {
                        const chunkIndex = Math.min(Math.floor(i * chunks.length / codeLines.length), chunks.length - 1);
                        explanations[i] = chunks[chunkIndex].replace(/^[\s\d\-:]*/, '').trim();
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing Gemini response:", error);
            // Create simple explanations as fallback
            explanations = codeLines.map((line, i) =>
                `${line.trim() ? "This code " + line.trim() : "Empty line or whitespace"}`
            );
        }

        // Ensure we have an explanation for each line
        const explanationResults = [];
        for (let i = 0; i < codeLines.length; i++) {
            // If we don't have an explanation for this line but the line has content
            if (!explanations[i] && codeLines[i].trim()) {
                explanationResults.push(`Code: ${codeLines[i].trim()}`);
            } else {
                // Use the explanation if available, otherwise use a default message
                explanationResults.push(explanations[i] || "No explanation available");
            }
        }
        
        return explanationResults;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`Failed to analyze code: ${error.message}`);
    }
}

// Helper function to review code with Gemini AI - optimized for gemini-2.0-flash model
async function reviewCodeWithGemini(code) {
    try {
        // Structured prompt for gemini-2.0-flash model with more detailed instructions
        const prompt = `Review the following code and provide detailed feedback. Format your response with these exact sections:
        1. Summary: A brief overview of what the code does
        2. Strengths: List at least 3 positive aspects of the code
        3. Improvements: List at least 3 specific suggestions for improvement
        4. Best Practices: List at least 3 best practices that should be followed

        Code to review:
        ${code}
        
        IMPORTANT: Your response MUST be in valid JSON format like this example:
        {
          "summary": "Brief summary of the code",
          "strengths": ["strength 1", "strength 2", "strength 3"],
          "improvements": ["improvement 1", "improvement 2", "improvement 3"],
          "bestPractices": ["practice 1", "practice 2", "practice 3"]
        }
        
        Do not include any text before or after the JSON object. Return ONLY the JSON object.`;

        // Using the new API format for gemini-2.0-flash
        const result = await model.generateContent({
            contents: [{
                parts: [{ text: prompt }]
            }]
        });
        const responseText = result.response.text();
        console.log('Raw response from Gemini API:', responseText.substring(0, 200) + '...');

        // More flexible parsing approach for free version
        try {
            // First try to find a JSON object in the response - using greedy match to capture the entire JSON object
            const jsonMatch = responseText.match(/{[\s\S]*}/);
            if (jsonMatch) {
                try {
                    console.log('Found JSON in response, attempting to parse');
                    const jsonString = jsonMatch[0].trim();
                    const reviewData = JSON.parse(jsonString);
                    console.log('Successfully parsed JSON response');
                    return {
                        summary: reviewData.summary || "No summary available",
                        strengths: Array.isArray(reviewData.strengths) ? reviewData.strengths : [],
                        improvements: Array.isArray(reviewData.improvements) ? reviewData.improvements : [],
                        bestPractices: Array.isArray(reviewData.bestPractices) ? reviewData.bestPractices : []
                    };
                } catch (parseError) {
                    console.error("Error parsing JSON from Gemini response:", parseError);
                    console.log("Raw JSON string that failed to parse:", jsonString);
                    // Try to clean the string and parse again
                    try {
                        // Remove any markdown code block markers and try again
                        const cleanedJson = jsonString.replace(/```json|```/g, '').trim();
                        console.log('Attempting to parse cleaned JSON string');
                        const reviewData = JSON.parse(cleanedJson);
                        console.log('Successfully parsed cleaned JSON response');
                        return {
                            summary: reviewData.summary || "No summary available",
                            strengths: Array.isArray(reviewData.strengths) ? reviewData.strengths : [],
                            improvements: Array.isArray(reviewData.improvements) ? reviewData.improvements : [],
                            bestPractices: Array.isArray(reviewData.bestPractices) ? reviewData.bestPractices : []
                        };
                    } catch (secondError) {
                        console.error("Failed to parse cleaned JSON:", secondError);
                        // Continue to alternative parsing methods
                    }
                }
            }
            
            // If JSON parsing fails, try to extract sections based on headings
            const sections = responseText.split(/\n\s*\n|\n#{1,3}\s+/); // Split by empty lines or markdown headings
            
            let summary = "";
            const strengths = [];
            const improvements = [];
            const bestPractices = [];
            
            // Extract summary (usually the first paragraph)
            if (sections.length > 0) {
                summary = sections[0].trim();
            }
            
            // Look for specific sections in the response
            for (const section of sections) {
                const lowerSection = section.toLowerCase();
                
                // Extract list items using regex
                const listItems = section.match(/[-*]\s+(.+?)(?=\n[-*]|$)/gs) || [];
                const processedItems = listItems.map(item => item.replace(/^[-*]\s+/, '').trim());
                
                if (lowerSection.includes('strength') || lowerSection.includes('positive') || lowerSection.includes('good')) {
                    strengths.push(...processedItems);
                } else if (lowerSection.includes('improv') || lowerSection.includes('issue') || lowerSection.includes('concern') || lowerSection.includes('fix')) {
                    improvements.push(...processedItems);
                } else if (lowerSection.includes('best practice') || lowerSection.includes('recommend') || lowerSection.includes('suggestion')) {
                    bestPractices.push(...processedItems);
                }
            }
            
            // If we found structured content, return it
            if (summary || strengths.length || improvements.length || bestPractices.length) {
                return {
                    summary: summary || "Code review completed",
                    strengths: strengths.length ? strengths : ["Code was submitted for review"],
                    improvements: improvements.length ? improvements : ["No specific improvements identified"],
                    bestPractices: bestPractices.length ? bestPractices : ["Follow standard coding conventions"]
                };
            }
        } catch (error) {
            console.error("Error parsing Gemini review response:", error);
        }

        // If all parsing attempts fail, create a simple review from the raw response
        const paragraphs = responseText.split('\n\n');
        return {
            summary: paragraphs[0] || "Code review completed",
            strengths: [paragraphs.length > 1 ? paragraphs[1] : "Code was submitted for review"],
            improvements: [paragraphs.length > 2 ? paragraphs[2] : "Try simplifying your code for better analysis"],
            bestPractices: [paragraphs.length > 3 ? paragraphs[3] : "Follow standard coding conventions"]
        };
    } catch (error) {
        console.error("Error calling Gemini API for code review:", error);
        return {
            summary: "Error generating review: " + error.message,
            strengths: ["Code was submitted for review"],
            improvements: ["Try again with a smaller code sample"],
            bestPractices: ["Ensure your code is properly formatted"]
        };
    }
}

io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        // If room doesn't exist, create it and set the user as admin
        if (!roomData[roomId]) {
            const code = `function sayHello() {
        console.log("Hello, World!");
      }`;
            roomData[roomId] = {
                code,
                canvasData: [],
                messages: [],
                selectedLanguage: "",
                admin: username, // Set the room creator as admin
                pendingRequests: [],
                approvedUsers: [username] // Initialize with admin as approved
            };
            console.log(`New room created by ${username} (admin)`);
            
            userSocketMap[socket.id] = username;
            socket.join(roomId);
        } else {
            // Check if user is admin or already approved
            const isAdmin = roomData[roomId].admin === username;
            const isApproved = roomData[roomId].approvedUsers && roomData[roomId].approvedUsers.includes(username);
            
            if (isAdmin || isApproved) {
                userSocketMap[socket.id] = username;
                socket.join(roomId);
                console.log(`${username} joined room ${roomId} (${isAdmin ? 'admin' : 'approved user'})`);
            } else {
                // User is not approved, send join request
                console.log(`${username} attempted to join room ${roomId} - sending join request`);
                socket.emit(ACTIONS.JOIN_REQUEST, { roomId });
                return; // Don't proceed with joining
            }
        }

        const clients = getAllConnectedClients(roomId);
        clients.forEach(client => {
            io.to(client.socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        if (roomData[roomId]) {
            roomData[roomId].code = code;
        }
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CHANGES, ({ roomId, socketId }) => {
        if (roomData[roomId]) {
            io.to(socketId).emit(ACTIONS.SYNC_CHANGES, { roomData: roomData[roomId] });
        }
    });

    socket.on(ACTIONS.MESSAGE, ({ roomId, message, username }) => {
        const timestamp = generateTimeStamp();
        const id = Date.now();
        if (roomData[roomId]) {
            roomData[roomId].messages.push({ message, username, id, timestamp });
        }
        io.to(roomId).emit(ACTIONS.MESSAGE, { message, id, username, timestamp });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        if (roomData[roomId]) {
            roomData[roomId].selectedLanguage = language;
        }
        socket.to(roomId).emit(ACTIONS.LANGUAGE_CHANGE, {
            username: userSocketMap[socket.id],
            language,
        });
    });

    // Handle canvas changes with proper locking
    socket.on(ACTIONS.CANVAS_CHANGE, ({ type, username, roomId, newChanges }) => {
        console.log(`Canvas change from ${username} in room ${roomId}`);

        if (roomData[roomId]) {
            // Store the changes in the room data
            roomData[roomId].canvasData = [...roomData[roomId].canvasData, ...newChanges];

            // Broadcast to all other clients in the room
            socket.to(roomId).emit(ACTIONS.CANVAS_CHANGE, {
                type,
                username,
                newChanges,
            });
        }
    });

    socket.on('analyze-code', async ({ roomId, code }) => {
        try {
            console.log(`Received code to analyze from room ${roomId}`);
            
            if (!code || typeof code !== 'string' || !code.trim()) {
                throw new Error('Invalid or empty code received');
            }

            // Get code analysis from Gemini AI
            const explanations = await analyzeCodeWithGemini(code);

            // Send the analysis back to the client
            console.log('Sending code analysis result');
            socket.emit('code-analysis-result', { explanations });
        } catch (error) {
            console.error('Error analyzing code:', error);
            socket.emit('code-analysis-result', {
                error: 'Failed to analyze code: ' + error.message,
                explanations: []
            });
        }
    });

    // Handle code review requests
    socket.on('review-code', async ({ roomId, code }) => {
        try {
            console.log('Received code to review from room:', roomId);

            if (!code || typeof code !== 'string' || !code.trim()) {
                throw new Error('Invalid or empty code received');
            }

            // Get code review from Gemini AI
            const review = await reviewCodeWithGemini(code);

            // Send the review back to the client
            console.log('Sending code review result');
            socket.emit('code-review-result', { review });
        } catch (error) {
            console.error('Error reviewing code:', error);
            socket.emit('code-review-result', {
                error: 'Failed to review code: ' + error.message
            });
        }
    });

    // Handle user presence for canvas
    socket.on("user-presence", ({ presence, roomId, username }) => {
        if (!userPresence[roomId]) {
            userPresence[roomId] = {};
        }
        userPresence[roomId][socket.id] = { ...presence, username };

        // Broadcast presence to all other clients in the room
        socket.to(roomId).emit("user-presence-update", {
            presences: Object.values(userPresence[roomId]),
        });
    });
    
    // Check if user is admin of the room
    socket.on(ACTIONS.CHECK_ADMIN_STATUS, ({ roomId }) => {
        const username = userSocketMap[socket.id];
        const isAdmin = roomData[roomId] && roomData[roomId].admin === username;
        
        socket.emit(ACTIONS.ADMIN_STATUS, { isAdmin });
        console.log(`Admin status check for ${username} in room ${roomId}: ${isAdmin}`);
    });
    
    // Get pending join requests
    socket.on(ACTIONS.GET_PENDING_REQUESTS, ({ roomId }) => {
        const username = userSocketMap[socket.id];
        if (roomData[roomId] && roomData[roomId].admin === username) {
            socket.emit(ACTIONS.PENDING_REQUESTS_UPDATE, { 
                pendingRequests: roomData[roomId].pendingRequests || [] 
            });
        }
    });
    
    // Get all participants in the room
    socket.on(ACTIONS.GET_PARTICIPANTS, ({ roomId }) => {
        const username = userSocketMap[socket.id];
        if (roomData[roomId] && roomData[roomId].admin === username) {
            const participants = getAllConnectedClients(roomId).map(participant => ({
                ...participant,
                isAdmin: participant.username === roomData[roomId].admin
            }));
            socket.emit(ACTIONS.PARTICIPANTS_UPDATE, { participants });
        }
    });
    
    // Handle join request from user
    socket.on(ACTIONS.JOIN_REQUEST, ({ roomId, username }) => {
        console.log(`Received join request from ${username} for room ${roomId}`);
        
        // Store the username in userSocketMap temporarily for identification
        userSocketMap[socket.id] = username;
        
        // Add to pending requests if not already there
        if (roomData[roomId]) {
            const existingRequest = (roomData[roomId].pendingRequests || []).find(
                request => request.username === username
            );
            
            if (!existingRequest) {
                if (!roomData[roomId].pendingRequests) {
                    roomData[roomId].pendingRequests = [];
                }
                
                roomData[roomId].pendingRequests.push({
                    username,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
                
                // Notify admin about the new request
                const adminSocketId = Object.keys(userSocketMap).find(
                    socketId => userSocketMap[socketId] === roomData[roomId].admin
                );
                
                if (adminSocketId) {
                    io.to(adminSocketId).emit(ACTIONS.PENDING_REQUESTS_UPDATE, {
                        pendingRequests: roomData[roomId].pendingRequests
                    });
                }
            }
        }
    });
    
    // Admin accepts a join request
    socket.on(ACTIONS.JOIN_REQUEST_ACCEPTED, ({ roomId, username }) => {
        const adminUsername = userSocketMap[socket.id];
        if (roomData[roomId] && roomData[roomId].admin === adminUsername) {
            // Add user to approved users list
            if (!roomData[roomId].approvedUsers) {
                roomData[roomId].approvedUsers = [roomData[roomId].admin]; // Initialize with admin
            }
            
            if (!roomData[roomId].approvedUsers.includes(username)) {
                roomData[roomId].approvedUsers.push(username);
            }
            
            // Remove from pending requests
            roomData[roomId].pendingRequests = (roomData[roomId].pendingRequests || []).filter(
                request => request.username !== username
            );
            
            // Notify the accepted user
            const targetSocket = Object.keys(userSocketMap).find(
                socketId => userSocketMap[socketId] === username
            );
            
            if (targetSocket) {
                io.to(targetSocket).emit(ACTIONS.JOIN_REQUEST_ACCEPTED, { roomId });
            }
            
            // Update admin's pending requests list
            socket.emit(ACTIONS.PENDING_REQUESTS_UPDATE, {
                pendingRequests: roomData[roomId].pendingRequests
            });
        }
    });
    
    // Admin rejects a join request
    socket.on(ACTIONS.JOIN_REQUEST_REJECTED, ({ roomId, username }) => {
        const adminUsername = userSocketMap[socket.id];
        if (roomData[roomId] && roomData[roomId].admin === adminUsername) {
            // Remove from pending requests
            roomData[roomId].pendingRequests = (roomData[roomId].pendingRequests || []).filter(
                request => request.username !== username
            );
            
            // Notify the rejected user
            const targetSocket = Object.keys(userSocketMap).find(
                socketId => userSocketMap[socketId] === username
            );
            if (targetSocket) {
                io.to(targetSocket).emit(ACTIONS.JOIN_REQUEST_REJECTED, { roomId });
            }
            
            // Update admin's pending requests list
            socket.emit(ACTIONS.PENDING_REQUESTS_UPDATE, {
                pendingRequests: roomData[roomId].pendingRequests
            });
        }
    });
    
    // Admin removes a participant
    socket.on(ACTIONS.REMOVE_PARTICIPANT, ({ roomId, username }) => {
        const adminUsername = userSocketMap[socket.id];
        if (roomData[roomId] && roomData[roomId].admin === adminUsername) {
            // Remove user from approved users list
            if (roomData[roomId].approvedUsers) {
                roomData[roomId].approvedUsers = roomData[roomId].approvedUsers.filter(
                    approvedUsername => approvedUsername !== username
                );
            }
            
            // Find the socket ID of the user to remove
            const participantSocketId = Object.keys(userSocketMap).find(
                socketId => userSocketMap[socketId] === username
            );
            
            if (participantSocketId) {
                // Notify the participant being removed
                io.to(participantSocketId).emit(ACTIONS.PARTICIPANT_REMOVED, { roomId });
                
                // Force disconnect from room
                io.sockets.sockets.get(participantSocketId)?.leave(roomId);
                
                // Notify other participants about the disconnection
                socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
                    socketId: participantSocketId,
                    username: username,
                });
            }
            
            // Update participants list for admin
            const updatedParticipants = getAllConnectedClients(roomId);
            socket.emit(ACTIONS.PARTICIPANTS_UPDATE, { participants: updatedParticipants });
        }
    });

    socket.on("disconnecting", () => {
        const rooms = [...socket.rooms];
        rooms.forEach(roomId => {
            if (roomId !== socket.id) {
                // Remove user presence when they disconnect
                if (userPresence[roomId] && userPresence[roomId][socket.id]) {
                    delete userPresence[roomId][socket.id];
                }

                // Clean up room if this was the last user
                if (io.sockets.adapter.rooms.get(roomId)?.size === 1) {
                    delete roomData[roomId];
                    delete userPresence[roomId];
                }

                socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
                    socketId: socket.id,
                    username: userSocketMap[socket.id],
                });
            }
        });
        delete userSocketMap[socket.id];
    });
});

// Force port 3001 to avoid conflicts
const PORT = 3001;

server.listen(PORT, () => {
    console.log(`Server has started listening on port ${PORT}`);
    console.log(`Using Gemini model: gemini-2.0-flash`);
});
