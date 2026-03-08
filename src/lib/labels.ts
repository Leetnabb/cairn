import i18n from '../i18n';

export const getMaturityLabel = (level: number) => i18n.t(`labels.maturity.${level}`);
export const getRiskLabel = (level: number) => i18n.t(`labels.risk.${level}`);
export const getDimensionLabel = (key: string) => i18n.t(`labels.dimensions.${key}`);
export const getHorizonLabel = (horizon: string) => i18n.t(`labels.horizon.${horizon}`);
export const getDateLocale = () => i18n.language === 'en' ? 'en-GB' : 'no-NO';
