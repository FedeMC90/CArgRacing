'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { saveToken } from '@/lib/auth';

type Tab = 'login' | 'register';

interface AuthResponse {
  token: string;
  player: { apodo: string } | null;
  needsApodo?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apodo, setApodo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'register') {
        const data = await api.post<AuthResponse>('/auth/register', { email, password, apodo });
        saveToken(data.token);
        router.push('/garage');
      } else {
        const data = await api.post<AuthResponse>('/auth/login', { email, password });
        saveToken(data.token);
        if (data.needsApodo) router.push('/setup-apodo');
        else router.push('/garage');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <style>{`
        .login-input {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          color: #fff !important;
          -webkit-text-fill-color: #fff !important;
          appearance: none !important;
          -webkit-appearance: none !important;
        }
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: #fff !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      {/* Imagen de fondo base — siempre visible */}
      <Image
        src="/assets/ui/login-bg.png"
        alt="CArgRacing login"
        fill
        style={{ objectFit: 'cover', imageRendering: 'pixelated', zIndex: 0 }}
        priority
      />

      {/* Máscara de registro — se superpone cuando tab === 'register' */}
      {tab === 'register' && (
        <Image
          src="/assets/ui/register-bg.png"
          alt=""
          fill
          style={{ objectFit: 'cover', imageRendering: 'pixelated', zIndex: 1 }}
          priority
        />
      )}

      {/* Overlay de interacción — mismo tamaño que la imagen */}
      <form
        onSubmit={handleSubmit}
        className="absolute inset-0"
        style={{ pointerEvents: 'none', zIndex: 2 }}
      >
        {/* Tab INICIAR SESIÓN */}
        <button
          type="button"
          onClick={() => { setTab('login'); setError(''); }}
          className="absolute"
          style={{
            left: '20%', top: '13%',
            width: '27%', height: '9%',
            pointerEvents: 'all',
            opacity: 0,
            cursor: 'pointer',
          }}
        />

        {/* Tab REGISTRARSE */}
        <button
          type="button"
          onClick={() => { setTab('register'); setError(''); }}
          className="absolute"
          style={{
            left: '47%', top: '13%',
            width: '27%', height: '9%',
            pointerEvents: 'all',
            opacity: 0,
            cursor: 'pointer',
          }}
        />

        {/* Input MAIL */}
        <input
          type="email"
          placeholder=""
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="absolute login-input"
          style={{
            left: tab === 'login' ? '34%' : '34%',
            top:  tab === 'login' ? '37%' : '36%',
            width: '43%', height: '10%',
            fontSize: 'clamp(10px, 1.8vw, 16px)',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            pointerEvents: 'all',
          }}
        />

        {/* Input CONTRASEÑA */}
        <input
          type="password"
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="absolute login-input"
          style={{
            left: tab === 'login' ? '34%' : '34%',
            top:  tab === 'login' ? '54%' : '49%',
            width: '43%', height: '10%',
            fontSize: 'clamp(10px, 1.8vw, 16px)',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            pointerEvents: 'all',
          }}
        />

        {/* Input APODO (solo en registro) */}
        {tab === 'register' && (
          <input
            type="text"
            placeholder=""
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            required
            maxLength={50}
            className="absolute login-input"
            style={{
              left: '34%', top: '61%',
              width: '43%', height: '10%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: 'clamp(10px, 1.8vw, 16px)',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              pointerEvents: 'all',
            }}
          />
        )}

        {/* Botón INGRESAR / ¡A CORRER! */}
        <button
          type="submit"
          disabled={loading}
          className="absolute"
          style={{
            left: '28%', top: '70%',
            width: '44%', height: '15%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            cursor: loading ? 'wait' : 'pointer',
            pointerEvents: 'all',
            opacity: loading ? 0.5 : 1,
          }}
        />

        {/* Mensaje de error */}
        {error && (
          <p
            className="absolute text-center"
            style={{
              left: '20%', top: '87%',
              width: '60%',
              color: '#cc0000',
              fontSize: 'clamp(9px, 1.4vw, 13px)',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              pointerEvents: 'none',
              textShadow: '1px 1px 0 #000',
            }}
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
