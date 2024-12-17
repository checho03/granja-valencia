// src/interfaces/index.ts

// Interface base para Cerdo
export interface ICerdoBase {
    arete: string;                // Identificador único del cerdo
    peso_inicial: number;         // Peso al ingresar al sistema
    peso_actual: number;          // Peso actual
    lote_id: string;             // Lote al que pertenece
    corral_id: string;           // Corral donde está ubicado
  }
  
  export interface ICerdo extends ICerdoBase {
    id: string;
    estado: 'ACTIVO' | 'VENDIDO' | 'MUERTO';
    ultima_fecha_pesaje: Date;
    created_at: Date;
    updated_at: Date;
  }
  
  // Interface base para Lote
  export interface ILoteBase {
    codigo: string;              // Código identificador del lote
    fecha_ingreso: Date;         // Fecha de creación del lote
    cantidad_inicial: number;     // Cantidad inicial de cerdos
    cantidad_actual: number;      // Cantidad actual de cerdos
  }
  
  export interface ILote extends ILoteBase {
    id: string;
    estado: 'ACTIVO' | 'FINALIZADO';
    created_at: Date;
    updated_at: Date;
  }
  
  // Interface base para Corral
  export interface ICorralBase {
    codigo: string;              // Código identificador del corral
    capacidad: number;           // Capacidad máxima de cerdos
    ocupacion_actual: number;    // Cantidad actual de cerdos
    lote_id: string;            // Lote al que pertenece
  }
  
  export interface ICorral extends ICorralBase {
    id: string;
    created_at: Date;
    updated_at: Date;
  }