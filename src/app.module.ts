import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { HealtCheckModule } from './healt-check/healt-check.module';

@Module({
  imports: [PaymentsModule, HealtCheckModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
