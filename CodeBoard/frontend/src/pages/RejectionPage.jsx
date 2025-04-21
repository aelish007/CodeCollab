import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function RejectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reason } = location.state || { reason: 'You were removed from the room' };

  const handleReturnHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary text-white p-4">
      <div className="max-w-md w-full bg-[#2d303a] rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-6 text-red-500">Access Denied</h1>
        
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-xl mb-2">{reason}</p>
          <p className="text-gray-400">You cannot access this collaborative session.</p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={handleReturnHome}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/80 text-white rounded-md transition-colors"
          >
            Return to Home
          </button>
          
          <button 
            onClick={() => navigate('/editor/' + Math.random().toString(36).substring(2, 8), { 
              state: { username: localStorage.getItem('currentUsername') || sessionStorage.getItem('currentUsername') } 
            })}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectionPage;