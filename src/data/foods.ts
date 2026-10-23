import type { FoodCategory, FoodItem } from '@/types'

const f = (
  id: string,
  name: string,
  category: FoodCategory,
  portionHint: string,
  kcal: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  gramsPerUnit?: number,
  unitName?: string,
): FoodItem => ({
  id,
  name,
  category,
  portionHint,
  gramsPerUnit,
  unitName,
  per100g: { kcal, proteinG, carbsG, fatG },
})

/**
 * Banco de alimentos do dia a dia (baseado na Tabela TACO / IBGE por 100g prontos para consumo).
 */
export const foods: FoodItem[] = [
  // ───────── Proteínas ─────────
  f('frango_grelhado', 'Peito de frango grelhado', 'protein', 'grelhado', 159, 32, 0, 2.5),
  f('patinho_moido', 'Carne bovina (patinho grelhado/moído)', 'protein', 'pronto', 219, 35.9, 0, 7.3),
  f('tilapia_grelhada', 'Filé de tilápia / peixe branco', 'protein', 'grelhado', 128, 26, 0, 2.7),
  f('ovo_inteiro', 'Ovo de galinha inteiro', 'protein', 'cozido/mexido', 146, 13.3, 0.6, 9.5, 50, 'unid.'),
  f('whey_protein', 'Whey Protein concentrado', 'protein', 'pó', 400, 80, 8, 5, 30, 'scoop'),
  f('iogurte_natural', 'Iogurte natural desnatado', 'protein', 'pote', 51, 5.8, 7, 0.3, 170, 'pote'),
  f('queijo_minas', 'Queijo minas frescal / ricota', 'protein', 'fatia', 214, 17.4, 3.2, 15, 30, 'fatia'),
  f('atum_agua', 'Atum sólido em água (escorrido)', 'protein', 'lata', 116, 26, 0, 1, 120, 'lata'),

  // ───────── Carboidratos ─────────
  f('arroz_branco', 'Arroz branco/integral cozido', 'carb', 'cozido', 128, 2.5, 28.1, 0.2),
  f('feijao_carioca', 'Feijão carioca/preto cozido', 'carb', 'cozido (50% caldo)', 76, 4.8, 13.6, 0.5),
  f('batata_doce', 'Batata-doce cozida', 'carb', 'cozida', 77, 0.6, 18.4, 0.1),
  f('batata_inglesa', 'Batata inglesa cozida / airfryer', 'carb', 'cozida/assada', 86, 1.7, 20, 0.1),
  f('macarrao_cozido', 'Macarrão cozido', 'carb', 'cozido', 157, 5.8, 30.9, 0.9),
  f('mandioca_cozida', 'Mandioca (aipim) cozida', 'carb', 'cozida', 125, 0.6, 30.1, 0.3),
  f('aveia_flocos', 'Aveia em flocos', 'carb', 'colher', 394, 13.9, 66.6, 8.5, 15, 'col. sopa'),
  f('pao_integral', 'Pão de forma integral', 'carb', 'fatia', 253, 9.4, 49.9, 3.7, 25, 'fatia'),
  f('pao_frances', 'Pão francês', 'carb', 'unidade', 300, 8, 58.6, 3.1, 50, 'unid.'),
  f('tapioca', 'Goma de tapioca hidratada', 'carb', 'panqueca', 240, 0, 60, 0),
  f('cuscuz_milho', 'Cuscuz de milho cozido', 'carb', 'cozido', 113, 2.2, 25.3, 0.7),

  // ───────── Frutas & Vegetais ─────────
  f('banana_prata', 'Banana prata / nanica', 'fruit_veg', 'unidade', 98, 1.3, 26, 0.1, 70, 'unid.'),
  f('maca', 'Maçã / Pera', 'fruit_veg', 'unidade', 56, 0.3, 15.2, 0, 130, 'unid.'),
  f('mamão_formosa', 'Mamão formosa / papaia', 'fruit_veg', 'fatia', 45, 0.8, 11.6, 0.1),
  f('morango', 'Morangos frescos', 'fruit_veg', 'porção', 30, 0.9, 6.8, 0.3),

  // ───────── Gorduras boas ─────────
  f('azeite_oliva', 'Azeite de oliva extra virgem', 'fat', 'fio/colher', 884, 0, 0, 100, 10, 'col. sopa'),
  f('pasta_amendoim', 'Pasta de amendoim integral', 'fat', 'colher', 588, 25, 20, 50, 15, 'col. sopa'),
  f('castanha_para', 'Castanhas (Pará / Caju / Nozes)', 'fat', 'porção', 643, 14.5, 15.1, 63.5),
  f('abacate', 'Abacate / Avocado', 'fat', 'porção', 96, 1.2, 6, 8.4),

  // ───────── Conforto / Encaixe Flexível ─────────
  f('chocolate_amargo', 'Chocolate meio amargo (50–70%)', 'comfort', 'quadradinhos', 540, 6, 52, 34, 25, 'porção'),
  f('doce_de_leite', 'Doce de leite tradicional', 'comfort', 'colher de sopa', 306, 6.5, 55, 7, 25, 'col. sopa'),
  f('pao_de_queijo', 'Pão de queijo assado', 'comfort', 'unidade média', 335, 5.1, 34.2, 20, 40, 'unid.'),
]

export const foodById = new Map(foods.map((item) => [item.id, item]))

export function getFood(id: string): FoodItem {
  const item = foodById.get(id)
  if (!item) throw new Error(`Alimento desconhecido: ${id}`)
  return item
}

export const foodCategoryLabels: Record<FoodCategory, string> = {
  protein: 'Proteína',
  carb: 'Carboidrato',
  fat: 'Gordura boa',
  fruit_veg: 'Fruta',
  comfort: 'Encaixe flexível',
}
