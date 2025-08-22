'use client';

import { useUser } from '@/features/guest-auth/contexts/UserContext';
import { AuthenticatedContent } from '@/features/guest-auth/components/AuthenticatedContent';
import { UnauthenticatedContent } from '@/features/guest-auth/components/UnauthenticatedContent';

export default function Home() {
  const { displayName, userId } = useUser();

  if (!displayName || !userId) {
    return <UnauthenticatedContent />;
  }

  return <AuthenticatedContent />;
}
