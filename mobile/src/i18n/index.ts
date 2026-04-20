import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ptBR from './locales/pt-BR';
import enUS from './locales/en-US';
import esES from './locales/es-ES';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
};

const deviceLocale = Localization.getLocales()[0]?.languageTag ?? 'pt-BR';
const supportedLocales = Object.keys(resources);
const fallbackLng = 'pt-BR';

const detectedLng = supportedLocales.find((l) => deviceLocale.startsWith(l.split('-')[0])) ?? fallbackLng;

i18n.use(initReactI18next).init({
  resources,
  lng: detectedLng,
  fallbackLng,
  interpolation: { escapeValue: false },
});

export default i18n;
