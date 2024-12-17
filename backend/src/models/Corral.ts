// Importamos los tipos necesarios y el modelo Lote para la relación
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { ICorral, ICorralBase } from '../interfaces';
import { Lote } from './Lote';

/**
 * Modelo Corral: Representa un espacio físico donde se albergan los cerdos
 * Los corrales están asociados a un lote específico y tienen un tipo que determina su uso
 */
export class Corral extends Model<ICorral, ICorralBase> {
  // Declaración de propiedades con tipos estrictos
  public id!: string;                     // Identificador único UUID
  public numero!: string;                 // Número o código identificador del corral
  public capacidad!: number;              // Cantidad máxima de cerdos que puede albergar
  public ocupacion_actual!: number;       // Cantidad actual de cerdos en el corral
  public lote_id!: string;                // ID del lote al que pertenece
  public tipo!: 'LECHON' | 'ENGORDE' | 'ENFERMERIA'; // Tipo/propósito del corral
  public peso_promedio_actual!: number;    // Peso promedio de los cerdos en el corral
}

// Inicialización del modelo con Sequelize
Corral.init(
  {
    // Definición de columnas de la tabla
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,     // Genera automáticamente un UUID v4
      primaryKey: true
    },
    numero: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true                        // No permite números de corral duplicados
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ocupacion_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0                     // Inicia vacío
    },
    lote_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {                       // Clave foránea a la tabla lotes
        model: Lote,
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.ENUM('LECHON', 'ENGORDE', 'ENFERMERIA'),
      allowNull: false
    },
    peso_promedio_actual: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0                     // Inicia en 0 hasta que se agreguen cerdos
    }
  },
  {
    sequelize,
    modelName: 'Corral',
    tableName: 'corrales',
    timestamps: true                      // Habilita createdAt y updatedAt automáticamente
  }
);

export default Corral;