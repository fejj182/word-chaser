'use client';

interface GuestSignInUIProps {
  // State props
  isLoading?: boolean;
  error?: string | null;
  isSignedIn?: boolean;
  displayName?: string | null;
  
  // Event handlers
  onSignIn?: () => void;
  onStartGame?: () => void;
}

export const GuestSignInUI = ({
  isLoading = false,
  error = null,
  isSignedIn = false,
  displayName = null,
  onSignIn,
  onStartGame,
}: GuestSignInUIProps) => {
  const handleSignIn = () => {
    if (onSignIn && !isLoading) {
      onSignIn();
    }
  };

  const handleStartGame = () => {
    if (onStartGame) {
      onStartGame();
    }
  };

  // Show user info if signed in, otherwise show sign-in button
  if (isSignedIn && displayName) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Welcome!
          </h2>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            <p className="text-xl font-semibold">{displayName}</p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleStartGame}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Play as Guest
      </button>
      
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};
