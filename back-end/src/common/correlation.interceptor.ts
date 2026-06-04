import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

export const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Ensures every HTTP request has a correlation id (read from the header or
 * generated) and echoes it back on the response, so clients and downstream
 * jobs can be traced end-to-end.
 */
@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const correlationId =
      (req.headers[CORRELATION_HEADER] as string) || uuid();
    req.correlationId = correlationId;
    res.setHeader(CORRELATION_HEADER, correlationId);

    return next.handle();
  }
}
