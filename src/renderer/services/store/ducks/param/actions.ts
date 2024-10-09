import { action } from 'typesafe-actions';
import { ParamTypes, Param } from './types';

export const setParam = (data: Param) => action(ParamTypes.SET_PARAM, { data });
