import { Module } from '@nestjs/common';
import { PlayStoreService } from './play-store.service';

@Module({
  providers: [PlayStoreService],
  exports: [PlayStoreService],
})
export class PlayStoreModule {}
