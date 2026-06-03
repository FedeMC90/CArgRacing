'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { clearToken, isLoggedIn } from '@/lib/auth';

const PhaserGarage = dynamic(() => import('@/components/PhaserGarage'), { ssr: false });

interface PlayerCar {
	id: string;
	car_id: string;
	color_hex: string;
	is_active: boolean;
	nombre: string;
	slug: string;
	hp_base: number;
	peso_kg: number;
	grip_base: number;
}

interface GarageData {
	id: string;
	apodo: string;
	pesos: number;
	reputacion: number;
	cochera_nivel: number;
	autos: PlayerCar[];
}

const COCHERA_NOMBRES: Record<number, string> = {
	1: 'Cochera derruida',
	2: 'Cochera arreglada',
	3: 'Taller semi-profesional',
	4: 'Garage privado',
};

const PRESET_COLORS = ['#CC0000', '#0044CC', '#00AA44', '#CCCC00', '#CC6600', '#880088', '#CCCCCC', '#111111'];

export default function GaragePage() {
	const router = useRouter();
	const [garage, setGarage] = useState<GarageData | null>(null);
	const [activeCar, setActiveCar] = useState<PlayerCar | null>(null);
	const [selectedColor, setSelectedColor] = useState('#CC0000');
	const [savingColor, setSavingColor] = useState(false);
	const [colorMsg, setColorMsg] = useState('');

	useEffect(() => {
		if (!isLoggedIn()) {
			router.push('/login');
			return;
		}
		api
			.get<GarageData>('/garage')
			.then((data) => {
				setGarage(data);
				const car = data.autos?.find((c) => c.is_active) ?? data.autos?.[0] ?? null;
				setActiveCar(car);
				if (car) setSelectedColor(car.color_hex);
			})
			.catch(() => {
				clearToken();
				router.push('/login');
			});
	}, [router]);

	const handleColorSave = useCallback(async () => {
		if (!activeCar) return;
		setSavingColor(true);
		setColorMsg('');
		try {
			await api.patch(`/garage/car/${activeCar.id}/color`, { colorHex: selectedColor });
			setActiveCar((prev) => (prev ? { ...prev, color_hex: selectedColor } : prev));
			setColorMsg('Color guardado');
			setTimeout(() => setColorMsg(''), 2000);
		} catch (err: unknown) {
			setColorMsg(err instanceof Error ? err.message : 'Error');
		} finally {
			setSavingColor(false);
		}
	}, [activeCar, selectedColor]);

	function handleLogout() {
		clearToken();
		router.push('/login');
	}

	if (!garage) {
		return (
			<div
				className='min-h-screen flex items-center justify-center'
				style={{ background: 'var(--bg)' }}
			>
				<p style={{ color: 'var(--text-muted)' }}>Cargando cochera...</p>
			</div>
		);
	}

	return (
		<div
			className='min-h-screen flex flex-col'
			style={{ background: 'var(--bg)' }}
		>
			{/* Header */}
			<header
				className='flex items-center justify-between px-4 py-3 border-b'
				style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
			>
				<div>
					<span
						className='text-xs ml-2'
						style={{ color: 'var(--text-muted)' }}
					>
						Garage de
					</span>
					<span
						className='font-bold'
						style={{ color: 'var(--accent)' }}
					>
						{' '}
						{garage.apodo}
					</span>
				</div>
				<div className='flex items-center gap-4 text-sm'>
					<span>
						💵 <strong>${garage.pesos.toLocaleString('es-AR')}</strong>
					</span>
					<span>
						⭐ <strong>{garage.reputacion}</strong>
					</span>
					<button
						onClick={handleLogout}
						className='text-xs'
						style={{ color: 'var(--text-muted)' }}
					>
						Salir
					</button>
				</div>
			</header>

			<div
				className='flex flex-1 flex-col md:flex-row'
				style={{ minHeight: 0 }}
			>
				{/* Phaser canvas */}
				<div
					className='flex-1 relative'
					style={{ minHeight: '400px' }}
				>
					{activeCar && (
						<PhaserGarage
							carSlug={activeCar.slug}
							colorHex={selectedColor}
						/>
					)}
				</div>

				{/* Panel lateral */}
				<aside
					className='hidden w-full md:w-64 p-4 flex flex-col gap-5 border-t md:border-t-0 md:border-l '
					style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
				>
					{activeCar && (
						<>
							<div>
								<h2
									className='font-bold text-lg'
									style={{ color: 'var(--accent)' }}
								>
									{activeCar.nombre}
								</h2>
								<div
									className='text-xs mt-2 flex flex-col gap-1'
									style={{ color: 'var(--text-muted)' }}
								>
									<span>🏎 {activeCar.hp_base} HP</span>
									<span>⚖️ {activeCar.peso_kg} kg</span>
									<span>🛞 Grip {activeCar.grip_base}/10</span>
								</div>
							</div>

							{/* Color picker */}
							<div>
								<p
									className='text-xs font-semibold mb-2'
									style={{ color: 'var(--text-muted)' }}
								>
									COLOR DE PINTURA
								</p>
								<div className='grid grid-cols-4 gap-2 mb-3'>
									{PRESET_COLORS.map((c) => (
										<button
											key={c}
											onClick={() => setSelectedColor(c)}
											className='w-8 h-8 rounded transition-transform'
											style={{
												background: c,
												border: selectedColor === c ? '2px solid var(--accent)' : '2px solid transparent',
												transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
											}}
										/>
									))}
								</div>
								<input
									type='color'
									value={selectedColor}
									onChange={(e) => setSelectedColor(e.target.value)}
									className='w-full h-8 rounded cursor-pointer'
									style={{ background: 'none', border: '1px solid var(--border)' }}
								/>
								<button
									onClick={handleColorSave}
									disabled={savingColor || selectedColor === activeCar.color_hex}
									className='mt-2 w-full py-2 rounded text-sm font-bold transition-opacity'
									style={{
										background: 'var(--accent)',
										color: '#000',
										opacity: savingColor || selectedColor === activeCar.color_hex ? 0.5 : 1,
									}}
								>
									{savingColor ? 'Guardando...' : 'Aplicar color'}
								</button>
								{colorMsg && (
									<p
										className='text-xs text-center mt-1'
										style={{ color: 'var(--accent)' }}
									>
										{colorMsg}
									</p>
								)}
							</div>
						</>
					)}
				</aside>
			</div>
		</div>
	);
}
