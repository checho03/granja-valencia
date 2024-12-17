// interfaces/ILote.ts
export interface ILoteBase {
  codigo: string;
  fecha_ingreso: Date;
  cantidad_inicial: number;
  cantidad_actual: number;
  peso_promedio_inicial: number;
  peso_promedio_actual: number;
  sitio?: string;
  observaciones?: string;  // Added observaciones field
}

export interface ILote extends ILoteBase {
  id: string;
  estado: 'ACTIVO' | 'FINALIZADO';
  fecha_finalizacion?: Date;
  created_at: Date;
  updated_at: Date;
}

// Interfaz para el Corral
export interface ICorralBase {
  numero: string;
  capacidad: number;
  ocupacion_actual: number;
  lote_id: string;
  tipo: 'LECHON' | 'ENGORDE' | 'ENFERMERIA';
  peso_promedio_actual: number;
}

export interface ICorral extends ICorralBase {
  id: string;
}

// Interfaz para el Cerdo
export interface ICerdoBase {
  arete: string;
  lote_id: string;
  corral_id: string;
  peso_inicial: number;
  peso_actual: number;
  fecha_ingreso: Date;
  semana_vida: number;
  estado: 'ACTIVO' | 'VENDIDO' | 'MUERTO' | 'ENFERMO';
  ultima_fecha_pesaje?: Date;
  observaciones?: string;
}

export interface ICerdo extends ICerdoBase {
  id: string;
}