-- Alquiler mensual estimado, para calcular la rentabilidad bruta de cada inmueble.
-- Se ejecuta una sola vez en Supabase, en SQL Editor. No afecta a los datos existentes.
alter table inmuebles
  add column if not exists alquiler_mes integer;
notify pgrst, 'reload schema';
