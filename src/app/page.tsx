import { GuestSignIn } from '@/components/GuestSignIn';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Word Chaser
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
          Challenge your vocabulary and race against time in this exciting word game!
        </p>
        <GuestSignIn />
      </div>
    </div>
  );
}
