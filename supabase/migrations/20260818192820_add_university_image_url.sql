ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS image_url text;

UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/32641545/pexels-photo-32641545.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'ESPM';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/23732423/pexels-photo-23732423.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'FEAUSP';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/29748447/pexels-photo-29748447.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'FGV';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/39077560/pexels-photo-39077560.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'FDC';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/21415155/pexels-photo-21415155.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'IBMEC';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/11097991/pexels-photo-11097991.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'INSPER';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/16817879/pexels-photo-16817879.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'LINK';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/281514/pexels-photo-281514.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'SAINTPAUL';
UPDATE public.universities SET image_url = 'https://images.pexels.com/photos/36078146/pexels-photo-36078146.jpeg?auto=compress&cs=tinysrgb&w=1920' WHERE university_id = 'SKEMA';