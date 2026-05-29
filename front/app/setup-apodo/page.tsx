'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SetupApodoPage() {
  const router = useRouter();
  const [apodo, setApodo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/apodo', { apodo });
      router.push('/garage');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--accent)' }}>
          ¿Cómo te conocen en la calle?
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--text-muted)' }}>
          Elegí tu apodo. Con ese nombre vas a aparecer en el juego.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Tu apodo"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            required
            maxLength={50}
            className="px-4 py-3 rounded text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#000', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Guardando...' : 'Confirmar apodo'}
          </button>
        </form>
      </div>
    </div>
  );
}
