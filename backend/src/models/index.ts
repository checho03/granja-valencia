// Importaciones necesarias
import { Sequelize } from 'sequelize';
import sequelize from '../config/database';
import { Lote } from './Lote';
import { Corral } from './Corral';
import { Cerdo } from './Cerdo';

// Relaciones entre Lote y Corral
// Un Lote puede tener muchos Corrales
Lote.hasMany(Corral, { 
    foreignKey: 'lote_id',     // Campo que relaciona en la tabla corrales
    as: 'corrales_lote'        // Alias para acceder a los corrales desde un lote
});
// Un Corral pertenece a un Lote
Corral.belongsTo(Lote, { 
    foreignKey: 'lote_id',     // Campo que relaciona en la tabla corrales
    as: 'lote'                 // Alias para acceder al lote desde un corral
});

// Relaciones con Cerdo
// Un Lote puede tener muchos Cerdos
Lote.hasMany(Cerdo, { 
    foreignKey: 'lote_id', 
    as: 'cerdos_lote' 
});
// Un Corral puede tener muchos Cerdos
Corral.hasMany(Cerdo, { 
    foreignKey: 'corral_id', 
    as: 'cerdos_corral' 
});
// Un Cerdo pertenece a un Lote
Cerdo.belongsTo(Lote, { 
    foreignKey: 'lote_id', 
    as: 'lote' 
});
// Un Cerdo pertenece a un Corral
Cerdo.belongsTo(Corral, { 
    foreignKey: 'corral_id', 
    as: 'corral' 
});

/**
 * Función para sincronizar los modelos con la base de datos
 * alter: true permite actualizar las tablas existentes
 * En producción, se recomienda usar { force: false } para evitar pérdida de datos
 */
export const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados con la base de datos');
  } catch (error) {
    console.error('Error al sincronizar modelos:', error);
  }
};

// Exportación de modelos y utilidades
export {
  sequelize,
  Lote,
  Corral,
  Cerdo
};