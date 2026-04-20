import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR';
import enUS from './locales/en-US';
import esES from './locales/es-ES';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
};

const supportedLocales = Object.keys(resources);
const browserLang = navigator.language ?? 'pt-BR';
const detected = supportedLocales.find((l) => browserLang.startsWith(l.split('-')[0])) ?? 'pt-BR';
const saved = localStorage.getItem('sentido_lang');
const lng = saved && supportedLocales.includes(saved) ? saved : detected;

i18n.use(initReactI18next).init({
  resources,
  lng,
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

export default i18n;
