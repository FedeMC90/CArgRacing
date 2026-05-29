-- Auto inicial: Renault 12
INSERT INTO cars (slug, nombre, descripcion, hp_base, peso_kg, grip_base, imagen_url)
VALUES (
  'renault-12',
  'Renault 12',
  'El clásico del barrio. Humilde pero con garra. Con las piezas justas, te sorprende.',
  62,
  895,
  6,
  '/assets/cars/renault-12.png'
)
ON CONFLICT (slug) DO NOTHING;
