import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Avatar from 'react-avatar';
import { SettingsContext } from '../../context/SettingsContext';
import { FaCheck, FaTimes, FaUserMinus } from 'react-icons/fa';
import ACTIONS from '../Actions';

function AdminPanel({ socketRef, roomId }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const settingsContext = useContext(SettingsContext);

  useEffect(() => {
    if (!socketRef.current) return;

    // Check if current user is admin
    socketRef.current.emit('check-admin-status', { 
      roomId, 
      username: settingsContext.settings.userName 
    });

    // Listen for admin status response
    socketRef.current.on('admin-status', ({ isAdmin }) => {
      setIsAdmin(isAdmin);
    });

    // Listen for pending requests updates
    socketRef.current.on('pending-requests-update', ({ pendingRequests }) => {
      setPendingRequests(pendingRequests || []);
    });

    // Listen for participants updates
    socketRef.current.on('participants-update', ({ participants }) => {
      setParticipants(participants);
    });

    // Request initial data
    if (roomId) {
      socketRef.current.emit('get-pending-requests', { roomId });
      socketRef.current.emit('get-participants', { roomId });
    }

    return () => {
      socketRef.current.off('admin-status');
      socketRef.current.off('pending-requests-update');
      socketRef.current.off('participants-update');
    };
  }, [roomId, socketRef, settingsContext.settings.userName]);

  const handleAcceptRequest = (username) => {
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.JOIN_REQUEST_ACCEPTED, { roomId, username });
      toast.success(`Accepted ${username}'s request to join`);
      
      // Request updated pending requests list
      socketRef.current.emit('get-pending-requests', { roomId });
    }
  };

  const handleRejectRequest = (username) => {
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.JOIN_REQUEST_REJECTED, { roomId, username });
      toast.success(`Rejected ${username}'s request to join`);
      
      // Request updated pending requests list
      socketRef.current.emit('get-pending-requests', { roomId });
    }
  };

  const handleRemoveParticipant = (username) => {
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.REMOVE_PARTICIPANT, { roomId, username });
      toast.success(`Removed ${username} from the room`);
      
      // Request updated participants list
      socketRef.current.emit('get-participants', { roomId });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col w-full h-[92vh] md:h-screen p-2">
        <div className="pb-2 text-xl font-bold">Admin Panel</div>
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-lg text-center">Only room admins can access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[92vh] md:h-screen p-2">
      <div className="pb-2 text-xl font-bold">Admin Panel</div>
      
      <div className="flex flex-col flex-1 gap-5 overflow-auto">
        {/* Pending Requests Section */}
        <div className="bg-secondary rounded-lg p-3">
          <h2 className="text-lg font-semibold mb-2">Pending Join Requests</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-400">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div key={request.username} className="flex items-center justify-between bg-[#2d303a] p-2 rounded">
                  <div className="flex items-center gap-2">
                    <Avatar name={request.username} size={40} round="14px" />
                    <span>{request.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAcceptRequest(request.username)}
                      className="p-2 bg-green-600 rounded hover:bg-green-700"
                      title="Accept"
                    >
                      <FaCheck />
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(request.username)}
                      className="p-2 bg-red-600 rounded hover:bg-red-700"
                      title="Reject"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participants Section */}
        <div className="bg-secondary rounded-lg p-3">
          <h2 className="text-lg font-semibold mb-2">Current Participants</h2>
          {participants.length === 0 ? (
            <p className="text-gray-400">No participants</p>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.username} className="flex items-center justify-between bg-[#2d303a] p-2 rounded">
                  <div className="flex items-center gap-2">
                    <Avatar name={participant.username} size={40} round="14px" />
                    <span>{participant.username}</span>
                    {participant.isAdmin && (
                      <span className="text-xs bg-primary text-white px-2 py-1 rounded">Admin</span>
                    )}
                  </div>
                  {!participant.isAdmin && (
                    <button 
                      onClick={() => handleRemoveParticipant(participant.username)}
                      className="p-2 bg-red-600 rounded hover:bg-red-700"
                      title="Remove"
                    >
                      <FaUserMinus />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;