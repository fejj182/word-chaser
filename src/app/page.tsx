"use client";

import { AuthenticatedContent } from '@/features/guest-auth/components/AuthenticatedContent';

export default function Home() {
  return <AuthenticatedContent />;
}
