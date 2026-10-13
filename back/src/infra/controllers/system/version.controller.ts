import { execSync } from 'child_process';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';

// Commit déployé : fourni par Render au runtime, sinon celui du checkout local.
function currentCommit(): string {
  if (process.env.RENDER_GIT_COMMIT) return process.env.RENDER_GIT_COMMIT;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'inconnu';
  }
}

const VERSION = { commit: currentCommit(), startedAt: new Date().toISOString() };

// Permet de vérifier depuis le front quelle version du back tourne (déploiement passé ou non).
@Public()
@Controller()
export class VersionController {
  @Get('version')
  get() {
    return VERSION;
  }
}
