import { GameScreen } from '@/features/game-play/components/GameScreen';
import { SessionProvider } from '@/features/session-management/contexts/SessionContext';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';

interface GamePageProps {
  params: {
    roomId: string;
  };
}

export default function GamePage(props: GamePageProps) {
  const params = props.params;
  return (
    <SessionProvider>
      <RoomProvider>
        <GameScreen roomId={params.roomId} />
      </RoomProvider>
    </SessionProvider>
  );
}
