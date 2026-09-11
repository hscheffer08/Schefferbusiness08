-- Repair two ENEM 2024 items that were merged during PDF materialization.
-- Also point their visuals through Conectaê's same-origin image proxy for reliable mobile rendering.

update public.official_exam_items
set
  skill_name = 'Média aritmética',
  prompt_text = $$Contratos de vários serviços disponíveis na internet apresentam uma quantidade excessiva de informações. Isso faz com que o tempo necessário para a leitura desses contratos possa ser longo.

O quadro apresenta uma amostra do tempo considerado necessário para a leitura completa do contrato de alguns serviços digitais.

ROMERO, L. Não li e concordo. Superinteressante, n. 307, ago. 2012 (adaptado).

O tempo médio, em minuto, necessário para a leitura completa de um contrato de serviço dentre os listados no quadro é, com uma casa decimal, aproximadamente,$$,
  option_a = '13,0.',
  option_b = '15,0.',
  option_c = '19,8.',
  option_d = '20,0.',
  option_e = '23,3.',
  image_url = 'https://xn--conecta-pya.app/api/proxy-enem-image?url=https%3A%2F%2Fzospydaosoqbdpxgpnni.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fimages%2Fenem%2F2024%2F154.png',
  image_alt = $$Tabela com duas colunas: tipo de serviço e tempo necessário para a leitura completa do contrato, em minuto. A: 36; B: 17; C: 27; D: 13; E: 13; F: 13.$$,
  source_page = null
where id = '7d4f1754-346b-4948-9e60-ef04ddf5e857'::uuid;

update public.official_exam_item_booklet_map
set correct_option = 'C', answer_status = 'verified'
where item_id = '7d4f1754-346b-4948-9e60-ef04ddf5e857'::uuid;

update public.official_exam_items
set
  skill_name = 'Geometria plana — setor circular',
  prompt_text = $$Um proprietário pretende instalar um sensor de presença para a proteção de seu imóvel. O sensor deverá detectar movimentos de objetos e pessoas numa determinada região plana. A figura ilustra a vista superior da área de cobertura, em forma de setor circular, de um sensor colocado no ponto S. Essa área depende da medida do ângulo α, em grau, e do raio R, em metro.

Ao aumentar o ângulo α ou o raio R, aumenta-se a área de cobertura do sensor. Entretanto, quanto maior essa área, maior o preço do sensor.

Para esse fim, há cinco tipos de sensores disponíveis no mercado, cada um com as seguintes características:
• tipo I: α = 15° e R = 20 m;
• tipo II: α = 30° e R = 22 m;
• tipo III: α = 40° e R = 12 m;
• tipo IV: α = 60° e R = 16 m;
• tipo V: α = 90° e R = 10 m.

Esse proprietário pretende adquirir um desses sensores que seja capaz de cobrir, no mínimo, uma área de 70 m², com o menor preço possível. Use 3 como valor aproximado para π.

O proprietário do imóvel deverá adquirir o sensor do tipo$$,
  option_a = 'I.',
  option_b = 'II.',
  option_c = 'III.',
  option_d = 'IV.',
  option_e = 'V.',
  image_url = 'https://xn--conecta-pya.app/api/proxy-enem-image?url=https%3A%2F%2Fzospydaosoqbdpxgpnni.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fimages%2Fenem%2F2024%2F155.png',
  image_alt = 'Diagrama de um setor circular azul com centro S, ângulo α e raio R, representando a área coberta pelo sensor.',
  source_page = null
where id = 'c9048dcf-2301-411c-ab50-0f934a70664d'::uuid;

update public.official_exam_item_booklet_map
set correct_option = 'E', answer_status = 'verified'
where item_id = 'c9048dcf-2301-411c-ab50-0f934a70664d'::uuid;
