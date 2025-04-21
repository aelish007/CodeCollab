import React from 'react';
import { FaSpinner } from 'react-icons/fa';

function WaitingRoom({ username, roomId }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-white p-4">
      <div className="bg-secondary p-6 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Waiting for Approval</h2>
        
        <div className="flex justify-center mb-4">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
        
        <p className="mb-2">
          Hello <span className="font-semibold">{username}</span>!
        </p>
        
        <p className="mb-4">
          Your request to join room <span className="font-mono bg-gray-700 px-2 py-1 rounded">{roomId}</span> has been sent to the admin.
        </p>
        
        <p className="text-gray-400 text-sm">
          Please wait while the room admin reviews your request. You'll be automatically redirected once approved.
        </p>
      </div>
    </div>
  );
}

export default WaitingRoom;