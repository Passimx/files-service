import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TranscriptionService } from '../services/transcription.service';
import { TranscriptionRequestDto } from '../dto/transcription-request.dto';
import { MessageDto } from '../../queue/dto/message.dto';
import { TopicsEnum } from '../../queue/types/topics.enum';

@Controller()
export class TranscriptionController {
    constructor(private readonly transcriptionService: TranscriptionService) {}

    @EventPattern(TopicsEnum.AUDIO_TRANSCRIPTION_REQUEST)
    transcribeAudio(@Payload() body: MessageDto) {
        const { data } = body.data;
        const request = data as TranscriptionRequestDto;
        this.transcriptionService.processTranscriptionRequest(request);
    }
}
