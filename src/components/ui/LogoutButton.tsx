'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" size="md" variant="secondary" disabled={loading} onClick={handleLogout}>
      {loading ? 'Saindo…' : 'Sair'}
    </Button>
  );
}
