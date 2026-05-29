'use client';

import { useEffect, useRef } from 'react';
import type { Game } from 'phaser';
import type { GarageScene } from '@/lib/phaser/GarageScene';

interface Props {
  carSlug: string;
  colorHex: string;
}

export default function PhaserGarage({ carSlug, colorHex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Este flag lo captura el cleanup. Si React Strict Mode desmonta antes
    // de que el import async resuelva, el flag evita crear el juego.
    let destroyed = false;

    (async () => {
      const Phaser = (await import('phaser')).default;
      const { GarageScene } = await import('@/lib/phaser/GarageScene');

      // Verificar después del await — puede haber llegado el cleanup
      if (destroyed || gameRef.current) return;

      const el = containerRef.current!;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: el,
        width: el.offsetWidth || 600,
        height: el.offsetHeight || 400,
        backgroundColor: '#0d0d0d',
        scene: [],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        audio: { noAudio: true },
      });

      game.events.once('ready', () => {
        if (!destroyed) {
          game.scene.add('GarageScene', GarageScene, true, { carSlug, colorHex });
        }
      });

      gameRef.current = game;
    })();

    return () => {
      destroyed = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('GarageScene') as GarageScene | null;
    scene?.setCarColor(colorHex);
  }, [colorHex]);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
  );
}
