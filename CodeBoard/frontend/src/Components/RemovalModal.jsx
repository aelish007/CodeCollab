import { useNavigate } from 'react-router-dom';

function RemovalModal({ isOpen, message, onClose }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onClose();
    navigate('/', { replace: true });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute z-50 w-screen h-screen overflow-y-hidden opacity-95 bg-white-300 backdrop-blur-sm bg-opacity-10">
      <div className="fixed sm:left-[25%] md:top-[25%] md:left-[35%] top-[20%] z-50 justify-center items-center w-full font-Montserrat">
        <div className="relative w-full max-w-md max-h-full p-4">
          <div className="relative rounded-lg shadow bg-background">
            <div className="flex items-center justify-between p-4 border-b rounded-t md:p-5 dark:border-gray-600">
              <h3 className="text-xl font-semibold text-red-500">
                Removed from Room
              </h3>
            </div>

            <div className="p-4 md:p-5">
              <div className="pb-3">
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-xl mb-2 text-center">{message}</p>
                <p className="text-gray-400 text-center">You cannot access this collaborative session anymore.</p>
              </div>

              <button
                onClick={handleGoHome}
                className="py-2 text-xl rounded bg-primary cursor-pointer w-full"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RemovalModal;