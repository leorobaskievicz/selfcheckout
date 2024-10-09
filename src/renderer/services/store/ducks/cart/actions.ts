import { action } from 'typesafe-actions';
import { CartTypes, ProductType } from './types';

export const add = (data: ProductType) => action(CartTypes.ADD, { data });
export const drop = (rowid: string) => action(CartTypes.DROP, { rowid });
export const update = (data: ProductType) => action(CartTypes.UPDATE, { data });
export const clean = () => action(CartTypes.CLEAN, {});
