import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

import { User, UserRole } from '../users/entities/user.entity';
import { OauthAccount, OauthProvider } from './entities/oauth-account.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { AuditLog } from '../common/entities/audit-log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(OauthAccount) private readonly oauthAccounts: Repository<OauthAccount>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    @InjectRepository(TokenBlacklist) private readonly blacklist: Repository<TokenBlacklist>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto, ip: string) {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.users.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.PATIENT,
      dateOfBirth: dto.dateOfBirth,
      specialty: dto.specialty,
      crmLink: dto.crmLink,
    });
    await this.users.save(user);

    await this.log(user.id, 'REGISTER', 'users', ip);
    return this.signToken(user);
  }

  async login(dto: LoginDto, ip: string) {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    await this.log(user.id, 'LOGIN', 'users', ip);
    return this.signToken(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, ip: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Usuário não encontrado');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Senha atual incorreta');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.users.save(user);
    await this.log(userId, 'CHANGE_PASSWORD', 'users', ip);
    return { message: 'Senha alterada com sucesso' };
  }

  // OAuth login: valida o idToken com o provider, encontra ou cria usuário+vínculo
  async oauthLogin(dto: OauthLoginDto, ip: string) {
    const { provider, idToken } = dto;

    const claims = await this.verifyProviderToken(provider, idToken);

    let oauthAccount = await this.oauthAccounts.findOne({
      where: { provider, providerUserId: claims.sub },
      relations: ['user'],
    });

    if (oauthAccount) {
      await this.log(oauthAccount.userId, 'OAUTH_LOGIN', provider, ip);
      return this.signToken(oauthAccount.user);
    }

    let user = claims.email
      ? await this.users.findOne({ where: { email: claims.email } })
      : null;

    if (!user) {
      user = this.users.create({
        fullName: claims.name ?? claims.email ?? 'Usuário',
        email: claims.email ?? `${provider}_${claims.sub}@sentido.app`,
        passwordHash: null as any,
        role: UserRole.PATIENT,
      });
      await this.users.save(user);
    }

    oauthAccount = this.oauthAccounts.create({
      userId: user.id,
      provider,
      providerUserId: claims.sub,
    });
    await this.oauthAccounts.save(oauthAccount);

    await this.log(user.id, 'OAUTH_REGISTER', provider, ip);
    return this.signToken(user);
  }

  // Revoga o token colocando o JTI na blacklist até o momento de expiração original
  async logout(jti: string, userId: string, exp: number, ip: string) {
    const expiresAt = new Date(exp * 1000);
    await this.blacklist.save(this.blacklist.create({ jti, userId, expiresAt }));
    await this.log(userId, 'LOGOUT', 'users', ip);
    // Limpa tokens expirados desta sessão (housekeeping passivo — não bloqueia a resposta)
    this.blacklist.delete({ userId, expiresAt: LessThan(new Date()) }).catch(() => {});
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const entry = await this.blacklist.findOne({ where: { jti } });
    return !!entry;
  }

  private async verifyProviderToken(
    provider: OauthProvider,
    idToken: string,
  ): Promise<{ sub: string; email?: string; name?: string }> {
    if (provider === OauthProvider.GOOGLE) {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (!res.ok) throw new UnauthorizedException('Token Google inválido');
      const data = await res.json() as { sub: string; email?: string; name?: string; aud?: string };
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (clientId && data.aud !== clientId) throw new UnauthorizedException('Token Google: aud inválido');
      return { sub: data.sub, email: data.email, name: data.name };
    }

    if (provider === OauthProvider.APPLE) {
      // Em produção: usar apple-signin-auth ou jwks-rsa para verificar assinatura
      const parts = idToken.split('.');
      if (parts.length !== 3) throw new UnauthorizedException('Token Apple inválido');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as {
        sub: string; email?: string; iss?: string;
      };
      if (payload.iss !== 'https://appleid.apple.com') throw new UnauthorizedException('Token Apple: iss inválido');
      return { sub: payload.sub, email: payload.email };
    }

    throw new UnauthorizedException('Provider OAuth não suportado');
  }

  private signToken(user: User) {
    const jti = randomUUID();
    const payload = { sub: user.id, email: user.email, role: user.role, fullName: user.fullName, jti };
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        locale: user.locale,
      },
    };
  }

  private async log(userId: string, action: string, resource: string, ip: string) {
    await this.auditLogs.save(
      this.auditLogs.create({ userId, action, targetResource: resource, ipAddress: ip }),
    );
  }
}
