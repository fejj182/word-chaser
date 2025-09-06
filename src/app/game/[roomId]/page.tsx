import { GameScreen } from '@/features/game-play/components/GameScreen';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';
import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';

type GamePageParams = Promise<{
    roomId: string;
}>

export default async function GamePage({params}: {params: GamePageParams}) {
  const {roomId} = await params;
  return (
    <RoomProvider>
      <GamePlayProvider>
        <GameScreen roomId={roomId} />
      </GamePlayProvider>
    </RoomProvider>
  );
}
