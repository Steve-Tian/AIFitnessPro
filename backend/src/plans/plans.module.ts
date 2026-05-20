import { Module } from '@nestjs/common';
import { ClaudeNotesService } from './claude-notes.service';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  controllers: [PlansController],
  providers: [PlansService, ClaudeNotesService],
})
export class PlansModule {}
