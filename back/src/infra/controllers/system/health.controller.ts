import { Controller, Get } from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';

// Health check Render.
@Public()
@Controller()
export class HealthController {
  @Get('health')
  get() {
    return { ok: true };
  }
}
