import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['refresh_token'] ?? null,
        (req: Request) => req?.body?.refreshToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string; sessionId: string }) {
    const rawToken =
      req?.cookies?.['refresh_token'] ?? req?.body?.refreshToken;
    if (!rawToken) throw new UnauthorizedException('Refresh token missing');
    return { ...payload, rawRefreshToken: rawToken };
  }
}
