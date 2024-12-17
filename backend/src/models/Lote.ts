// Importamos los tipos necesarios de sequelize y nuestras interfaces
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { ILote, ILoteBase } from '../interfaces';

/**
 * Modelo Lote: Representa un grupo de cerdos que ingresan juntos al sistema
 * Extiende Model de Sequelize usando nuestras interfaces personalizadas
 */
export class Lote extends Model<ILote, ILoteBase> {
  // Declaramos las propiedades con tipos estrictos
  public id!: string;                    // Identificador único UUID
  public codigo!: string;                // Código de referencia del lote (ej: LOTE-2024-001)
  public fecha_ingreso!: Date;           // Fecha cuando el lote ingresó al sistema
  public cantidad_inicial!: number;       // Cantidad de cerdos al inicio del lote
  public cantidad_actual!: number;        // Cantidad actual de cerdos (puede disminuir por ventas/muertes)
  public peso_promedio_inicial!: number;  // Peso promedio de los cerdos al ingresar
  public peso_minimo_inicial!: number;    // Peso del cerdo más liviano al ingresar
  public peso_maximo_inicial!: number;    // Peso del cerdo más pesado al ingresar
  public semana_ingreso!: number;         // Número de semana del año en que ingresó
  public estado!: 'ACTIVO' | 'FINALIZADO'; // Estado actual del lote
  public sitio!: 'LECHON' | 'ENGORDE';    // Ubicación/etapa actual del lote
  public observaciones?: string;  // Added observaciones field
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// Inicialización del modelo con Sequelize
Lote.init(
  {
    // Definición de columnas de la tabla
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,    // Genera automáticamente un UUID v4
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true                       // No permite códigos duplicados
    },
    fecha_ingreso: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cantidad_inicial: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad_actual: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    peso_promedio_inicial: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    peso_minimo_inicial: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    peso_maximo_inicial: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    semana_ingreso: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'FINALIZADO'),
      defaultValue: 'ACTIVO'             // Por defecto, los lotes se crean activos
    },
    sitio: {
      type: DataTypes.ENUM('LECHON', 'ENGORDE'),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Lote',
    tableName: 'lotes',
    timestamps: true                     // Habilita createdAt y updatedAt automáticamente
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }

);

export default Lote;