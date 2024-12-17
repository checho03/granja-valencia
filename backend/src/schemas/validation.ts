// src/schemas/validation.ts

import Joi from 'joi';

export const loteSchema = Joi.object({
  codigo: Joi.string()
    .required()
    .pattern(/^LOTE-\d{4}-\d{3}$/)
    .message('El código debe tener el formato LOTE-YYYY-NNN'),
  fecha_ingreso: Joi.date()
    .required()
    .max('now')
    .message('La fecha de ingreso no puede ser futura'),
  cantidad_inicial: Joi.number()
    .integer()
    .min(1)
    .required()
    .message('La cantidad inicial debe ser un número entero positivo'),
  cantidad_actual: Joi.number()
    .integer()
    .min(0)
    .max(Joi.ref('cantidad_inicial'))
    .message('La cantidad actual no puede ser mayor que la cantidad inicial'),
  peso_promedio_inicial: Joi.number()
    .min(0)
    .required()
    .message('El peso promedio inicial debe ser un número positivo'),
  peso_minimo_inicial: Joi.number()
    .min(0)
    .max(Joi.ref('peso_promedio_inicial'))
    .required()
    .message('El peso mínimo debe ser menor o igual al peso promedio'),
  peso_maximo_inicial: Joi.number()
    .min(Joi.ref('peso_promedio_inicial'))
    .required()
    .message('El peso máximo debe ser mayor o igual al peso promedio'),
  semana_ingreso: Joi.number()
    .integer()
    .min(1)
    .max(53)
    .required()
    .message('La semana debe estar entre 1 y 53'),
  estado: Joi.string()
    .valid('ACTIVO', 'FINALIZADO')
    .default('ACTIVO'),
  sitio: Joi.string()
    .valid('LECHON', 'ENGORDE')
    .required()
});

export const corralSchema = Joi.object({
  numero: Joi.string()
    .required()
    .pattern(/^[A-Z]-\d{2}$/)
    .message('El número de corral debe tener el formato L-NN'),
  capacidad: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .required()
    .message('La capacidad debe ser entre 1 y 50 cerdos'),
  ocupacion_actual: Joi.number()
    .integer()
    .min(0)
    .max(Joi.ref('capacidad'))
    .default(0)
    .message('La ocupación no puede exceder la capacidad'),
  lote_id: Joi.string()
    .uuid()
    .required()
    .message('El ID del lote debe ser un UUID válido'),
  tipo: Joi.string()
    .valid('LECHON', 'ENGORDE', 'ENFERMERIA')
    .required(),
  peso_promedio_actual: Joi.number()
    .min(0)
    .default(0)
});

export const cerdoSchema = Joi.object({
  arete: Joi.string()
    .required()
    .pattern(/^[A-Z]-\d{6}$/)
    .message('El número de arete debe tener el formato L-NNNNNN'),
  lote_id: Joi.string()
    .uuid()
    .required()
    .message('El ID del lote debe ser un UUID válido'),
  corral_id: Joi.string()
    .uuid()
    .required()
    .message('El ID del corral debe ser un UUID válido'),
  peso_inicial: Joi.number()
    .min(0)
    .required()
    .message('El peso inicial debe ser un número positivo'),
  peso_actual: Joi.number()
    .min(Joi.ref('peso_inicial'))
    .message('El peso actual no puede ser menor al peso inicial'),
  fecha_ingreso: Joi.date()
    .required()
    .max('now')
    .message('La fecha de ingreso no puede ser futura'),
  semana_vida: Joi.number()
    .integer()
    .min(1)
    .max(52)
    .required()
    .message('La semana de vida debe estar entre 1 y 52'),
  estado: Joi.string()
    .valid('ACTIVO', 'VENDIDO', 'MUERTO', 'ENFERMO')
    .default('ACTIVO'),
  ultima_fecha_pesaje: Joi.date()
    .max('now'),
  observaciones: Joi.string()
    .max(1000)
});

// Esquemas para actualizaciones (parciales)
export const updateLoteSchema = loteSchema.fork(
  ['codigo', 'fecha_ingreso', 'cantidad_inicial', 'peso_promedio_inicial', 'peso_minimo_inicial', 'peso_maximo_inicial', 'semana_ingreso', 'sitio'],
  (schema) => schema.optional()
);

export const updateCorralSchema = corralSchema.fork(
  ['numero', 'lote_id'],
  (schema) => schema.optional()
);

export const updateCerdoSchema = cerdoSchema.fork(
  ['arete', 'lote_id', 'corral_id', 'peso_inicial', 'fecha_ingreso', 'semana_vida'],
  (schema) => schema.optional()
);