-- Añade a la tabla inmuebles los datos que se ven en la ficha de detalle.
-- Se ejecuta una sola vez en Supabase, en SQL Editor.
alter table inmuebles
  add column if not exists habitaciones integer,
  add column if not exists banos integer,
  add column if not exists estado text,
  add column if not exists referencia text,
  add column if not exists inmobiliaria text;

-- Refresca la caché de la API para que reconozca las columnas nuevas
notify pgrst, 'reload schema';
