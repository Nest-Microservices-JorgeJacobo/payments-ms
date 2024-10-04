import { Module } from '@nestjs/common';
import { HealtCheckController } from './healt-check.controller';

@Module({
  controllers: [HealtCheckController]
})
export class HealtCheckModule {}
