// Importaciones necesarias para el modelo
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { ICerdo, ICerdoBase } from '../interfaces';
import { Lote } from './Lote';
import { Corral } from './Corral';

/**
 * Modelo Cerdo: Representa un cerdo individual en el sistema
 * Cada cerdo pertenece a un lote y está ubicado en un corral específico
 */
export class Cerdo extends Model<ICerdo, ICerdoBase> {
  // Declaración de propiedades con tipos estrictos
  public id!: string;                    // Identificador único UUID
  public arete!: string;                 // Número de identificación físico del cerdo
  public lote_id!: string;               // ID del lote al que pertenece
  public corral_id!: string;             // ID del corral donde está ubicado
  public peso_inicial!: number;          // Peso al momento del ingreso
  public peso_actual!: number;           // Peso actual del cerdo
  public fecha_ingreso!: Date;           // Fecha cuando ingresó al sistema
  public semana_vida!: number;           // Semana de vida del cerdo
  public estado!: 'ACTIVO' | 'VENDIDO' | 'MUERTO' | 'ENFERMO'; // Estado actual
  public ultima_fecha_pesaje?: Date;     // Última fecha en que se registró el peso
  public observaciones?: string;         // Notas adicionales sobre el cerdo
}

// Inicialización del modelo con Sequelize
Cerdo.init(
  {
    // Definición de columnas de la tabla
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,    // Genera automáticamente un UUID v4
      primaryKey: true
    },
    arete: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true                       // No permite números de arete duplicados
    },
    lote_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {                      // Clave foránea a la tabla lotes
        model: Lote,
        key: 'id'
      }
    },
    corral_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {                      // Clave foránea a la tabla corrales
        model: Corral,
        key: 'id'
      }
    },
    peso_inicial: {
      type: DataTypes.FLOAT,
      allowNull: false                   // Peso obligatorio al crear el registro
    },
    peso_actual: {
      type: DataTypes.FLOAT,
      allowNull: false                   // Se actualiza con cada pesaje
    },
    fecha_ingreso: {
      type: DataTypes.DATE,
      allowNull: false                   // Fecha obligatoria
    },
    semana_vida: {
      type: DataTypes.INTEGER,
      allowNull: false                   // Control de edad del cerdo
    },
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'VENDIDO', 'MUERTO', 'ENFERMO'),
      defaultValue: 'ACTIVO'             // Por defecto los cerdos se crean activos
    },
    ultima_fecha_pesaje: {
      type: DataTypes.DATE               // Opcional, se actualiza con cada pesaje
    },
    observaciones: {
      type: DataTypes.TEXT               // Campo de texto libre para notas
    }
  },
  {
    sequelize,
    modelName: 'Cerdo',
    tableName: 'cerdos',
    timestamps: true                     // Habilita createdAt y updatedAt automáticamente
  }
);

export default Cerdo;