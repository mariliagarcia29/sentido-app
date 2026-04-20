import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Resolve the best matching locale from the Accept-Language header
function resolveLocale(acceptLanguage: string | undefined): SupportedLocale {
  if (!acceptLanguage) return 'pt-BR';
  const candidates = acceptLanguage
    .split(',')
    .map((s) => s.split(';')[0].trim());
  for (const candidate of candidates) {
    const exact = SUPPORTED_LOCALES.find((l) => l === candidate);
    if (exact) return exact;
    // Partial match: 'pt' → 'pt-BR', 'en' → 'en-US', 'es' → 'es-ES'
    const partial = SUPPORTED_LOCALES.find((l) => l.startsWith(candidate.split('-')[0]));
    if (partial) return partial;
  }
  return 'pt-BR';
}

@Injectable()
export class I18nInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    req.locale = resolveLocale(req.headers['accept-language']);
    return next.handle();
  }
}
