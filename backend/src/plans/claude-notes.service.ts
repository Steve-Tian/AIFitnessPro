import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

export interface DayNoteInput {
  id: string;
  dayType: string;
  exercises: string[];
}

@Injectable()
export class ClaudeNotesService {
  private readonly logger = new Logger(ClaudeNotesService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  appendDayNotes(days: DayNoteInput[]): void {
    if (!this.client) return;
    void this.generateNotes(days);
  }

  private async generateNotes(days: DayNoteInput[]): Promise<void> {
    for (const day of days) {
      try {
        const message = await this.client!.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 60,
          messages: [
            {
              role: 'user',
              content: `你是中文健身教练。为以下训练日生成一句激励语（不超过20个中文字符，只输出激励语本身）：\n训练类型：${day.dayType}\n动作：${day.exercises.join('、')}`,
            },
          ],
        });

        const block = message.content[0];
        const note = block.type === 'text' ? block.text.trim() : null;
        if (note) {
          await this.prisma.planDay.update({
            where: { id: day.id },
            data: { dayNote: note },
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to generate day note for ${day.id}: ${String(error)}`);
      }
    }
  }
}
