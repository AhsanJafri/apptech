import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { AdsTxtModule } from '../ads-txt/ads-txt.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlayStoreModule } from '../play-store/play-store.module';

@Module({
  imports: [AdsTxtModule, NotificationsModule, PlayStoreModule],
  controllers: [MonitorController],
  providers: [MonitorService],
})
export class MonitorModule {}
