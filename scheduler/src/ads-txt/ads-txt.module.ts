import { Module } from '@nestjs/common';
import { AdsTxtService } from './ads-txt.service';

@Module({
  providers: [AdsTxtService],
  exports: [AdsTxtService],
})
export class AdsTxtModule {}
