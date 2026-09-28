import { AuthProvider } from '@/app/hooks/useAuth';
import Game from '@/app/components/Game';

export default function HomePage() {
  return (
    <AuthProvider>
      <Game />
    </AuthProvider>
  );
}