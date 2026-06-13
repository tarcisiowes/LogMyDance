export type AttributeSelection = 'single' | 'multi';
export type ForroValue = { key: string; label: string };
export type ForroDimension = {
  key: string;
  label: string;
  selection: AttributeSelection;
  values: ForroValue[];
};

const FOOT_VALUES: ForroValue[] = [
  { key: 'direito', label: 'Direito' },
  { key: 'esquerdo', label: 'Esquerdo' },
  { key: 'indiferente', label: 'Indiferente' },
];

/**
 * Default forró taxonomy seeded into the DB on first run. Labels here are the
 * PT-BR fallback stored in `attribute_values.label`; the UI prefers the i18n
 * key (`attributes.dim.<dimKey>` / `attributes.val.<dimKey>.<valKey>`) for
 * non-custom rows. Users can add their own dimensions/values on top of these.
 */
export const FORRO_ATTRIBUTES: ForroDimension[] = [
  { key: 'pe_inicio', label: 'Pé de início', selection: 'single', values: FOOT_VALUES },
  { key: 'pe_fim', label: 'Pé de término', selection: 'single', values: FOOT_VALUES },
  {
    key: 'maos',
    label: 'Mãos',
    selection: 'single',
    values: [
      { key: 'so_direita', label: 'Só direita' },
      { key: 'so_esquerda', label: 'Só esquerda' },
      { key: 'ambas', label: 'As duas' },
      { key: 'solto', label: 'Solto' },
    ],
  },
  {
    key: 'pisadas',
    label: 'Nº de pisadas',
    selection: 'single',
    values: [
      { key: '3', label: '3' },
      { key: '5', label: '5' },
      { key: '7', label: '7' },
      { key: '9', label: '9' },
    ],
  },
  {
    key: 'andamento',
    label: 'Andamento',
    selection: 'multi',
    values: [
      { key: 'lento', label: 'Lento' },
      { key: 'medio', label: 'Médio' },
      { key: 'rapido', label: 'Rápido' },
    ],
  },
  {
    key: 'distancia',
    label: 'Distância',
    selection: 'single',
    values: [
      { key: 'junto', label: 'Junto' },
      { key: 'afastado', label: 'Afastado' },
    ],
  },
  {
    key: 'estilo_forro',
    label: 'Estilo',
    selection: 'multi',
    values: [
      { key: 'universitario', label: 'Universitário' },
      { key: 'roots', label: 'Roots' },
    ],
  },
  {
    key: 'giro',
    label: 'Giro',
    selection: 'multi',
    values: [
      { key: 'sem_giro', label: 'Sem giro' },
      { key: 'dama', label: 'Giro da dama' },
      { key: 'cavalheiro', label: 'Giro do cavalheiro' },
      { key: 'dois', label: 'Giro dos dois' },
    ],
  },
  {
    key: 'dificuldade',
    label: 'Dificuldade',
    selection: 'single',
    values: [
      { key: 'basico', label: 'Básico' },
      { key: 'intermediario', label: 'Intermediário' },
      { key: 'avancado', label: 'Avançado' },
    ],
  },
];
