import { GameScreen } from '@/features/game-play/components/GameScreen';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';

type GamePageParams = Promise<{
    roomId: string;
}>

export default async function GamePage({params}: {params: GamePageParams}) {
  const {roomId} = await params;
  return (
    <RoomProvider>
      <GameScreen roomId={roomId} />
    </RoomProvider>
  );
}
