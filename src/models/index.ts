// src/models/index.ts

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

// Modelo Cerdo
export class Cerdo extends Model {
  public id!: string;
  public arete!: string;
  public peso_inicial!: number;
  public peso_actual!: number;
  public estado!: 'ACTIVO' | 'VENDIDO' | 'MUERTO';
  public ultima_fecha_pesaje!: Date;
  public lote_id!: string;
  public corral_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Cerdo.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  arete: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  peso_inicial: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  peso_actual: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'VENDIDO', 'MUERTO'),
    allowNull: false,
    defaultValue: 'ACTIVO'
  },
  ultima_fecha_pesaje: {
    type: DataTypes.DATE,
    allowNull: false
  },
  lote_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  corral_id: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'cerdos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Modelo Lote
export class Lote extends Model {
  public id!: string;
  public codigo!: string;
  public fecha_ingreso!: Date;
  public cantidad_inicial!: number;
  public cantidad_actual!: number;
  public estado!: 'ACTIVO' | 'FINALIZADO';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Lote.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
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
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'FINALIZADO'),
    allowNull: false,
    defaultValue: 'ACTIVO'
  }
}, {
  sequelize,
  tableName: 'lotes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Modelo Corral
export class Corral extends Model {
  public id!: string;
  public codigo!: string;
  public capacidad!: number;
  public ocupacion_actual!: number;
  public lote_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Corral.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ocupacion_actual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lote_id: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'corrales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Definir relaciones
Lote.hasMany(Corral, { as: 'corrales', foreignKey: 'lote_id' });
Corral.belongsTo(Lote, { as: 'lote', foreignKey: 'lote_id' });

Lote.hasMany(Cerdo, { as: 'cerdos', foreignKey: 'lote_id' });
Cerdo.belongsTo(Lote, { as: 'lote', foreignKey: 'lote_id' });

Corral.hasMany(Cerdo, { as: 'cerdos', foreignKey: 'corral_id' });
Cerdo.belongsTo(Corral, { as: 'corral', foreignKey: 'corral_id' });

export { Lote, Corral, Cerdo };