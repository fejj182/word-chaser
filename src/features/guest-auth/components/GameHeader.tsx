'use client';

export const GameHeader = () => {
  return (
    <>
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Word Chaser
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
        Challenge your vocabulary and race against time in this exciting word game!
      </p>
    </>
  );
};
