import { IsEnum, IsString, MaxLength } from 'class-validator';
import { OauthProvider } from '../entities/oauth-account.entity';

export class OauthLoginDto {
  @IsEnum(OauthProvider)
  provider: OauthProvider;

  // ID token emitido pelo provider (Google ID Token / Apple Identity Token)
  @IsString()
  @MaxLength(4096)
  idToken: string;
}
