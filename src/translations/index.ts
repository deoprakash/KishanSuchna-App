// Translation system for Indian regional languages
import en from './en.json';
import hi from './hi.json';
import te from './te.json';
import ta from './ta.json';
import gu from './gu.json';
import mr from './mr.json';
import bn from './bn.json';
import pa from './pa.json';
import kn from './kn.json';
import ml from './ml.json';
import od from './od.json';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'od', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
];

export const translations = {
  en,
  hi,
  te,
  ta,
  gu,
  mr,
  bn,
  pa,
  kn,
  ml,
  od,
};

export default translations;