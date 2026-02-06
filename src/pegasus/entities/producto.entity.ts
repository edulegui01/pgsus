export interface Product {
  id?: number;
  codigo_barra?: string;
  foto?: string;
  impuesto?: number;
  promociones?: string;
  fecha_actualizacion?: Date;
  categ_prod_id?: number;
  balanza?: number;
  tipo_articulo?: number;
  tipo_unidad_medida?: number;
  pesable?: number;
  habilitado?: number;
  codigo: string;
  precio: number;
  total?: number;
  descripcion: string;
  peso_gramos?: string;
  cantidad?: number;
  total_venta?: number;
  nivel3?: number;
  descripcion_corta?: string;
}
