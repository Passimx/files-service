import { join } from 'path';
import { readFileSync, promises as fs } from 'fs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as vosk from 'vosk-koffi';
import ffmpeg from 'fluent-ffmpeg';
import { Envs } from '../../../common/envs/env';
import { TranscriptionRequestDto, TranscriptionResponseDto } from '../dto/transcription-request.dto';
import { QueueService } from '../../queue/services/queue.service';
import { TopicsEnum } from '../../queue/types/topics.enum';
import { EventsEnum } from '../../queue/types/events.enum';
import { DataResponse } from '../../../common/swagger/data-response.dto';

@Injectable()
export class TranscriptionService implements OnModuleInit {
    private voskModel: vosk.Model | null = null;
    private readonly STORAGE_ROOT = join(process.cwd(), 'data', 'files');

    constructor(private readonly queueService: QueueService) {}

    onModuleInit() {
        this.voskModel = new vosk.Model(Envs.vosk.path);
    }

    async transcribe(audioBuffer: Buffer): Promise<string> {
        if (!this.voskModel) {
            throw new Error('Vosk model not loaded');
        }

        const wavFilePath = await this.convertToWav(audioBuffer);

        try {
            const rec = new vosk.Recognizer({ model: this.voskModel, sampleRate: 16000 });
            rec.setMaxAlternatives(0);
            rec.setWords(false);

            const wavBuffer = readFileSync(wavFilePath);
            const wavData = wavBuffer.slice(44);

            const chunkSize = 4000;
            let finalResult = '';

            for (let i = 0; i < wavData.length; i += chunkSize) {
                const chunk = wavData.slice(i, i + chunkSize);
                if (rec.acceptWaveform(chunk)) {
                    const result = rec.result() as { text?: string };

                    if (result?.text) {
                        finalResult += result.text + ' ';
                    }
                }
            }

            const final = rec.finalResult() as { text?: string };

            if (final?.text) {
                finalResult += final.text;
            }

            rec.free();
            const text = finalResult.trim();
            const textWithPunctuation = this.addPunctuation(text);
            return textWithPunctuation;
        } finally {
            await fs.unlink(wavFilePath).catch(() => {});
        }
    }

    private async convertToWav(audioBuffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const tempInputPath = join(this.STORAGE_ROOT, `${timestamp}.mp3`);
            const tempOutputPath = join(this.STORAGE_ROOT, `${timestamp}.wav`);

            fs.writeFile(tempInputPath, audioBuffer)
                .then(() => {
                    ffmpeg(tempInputPath)
                        .toFormat('wav')
                        .audioChannels(1)
                        .audioFrequency(16000)
                        .on('end', () => {
                            fs.unlink(tempInputPath).catch(() => {});
                            resolve(tempOutputPath);
                        })
                        .on('error', (error: Error) => {
                            fs.unlink(tempInputPath).catch(() => {});
                            reject(error);
                        })
                        .save(tempOutputPath);
                })
                .catch(reject);
        });
    }

    private addPunctuation(text: string): string {
        if (!text) return text;

        let result = text.replace(/\s+/g, ' ').trim();

        if (result && !/[.!?]$/.test(result)) {
            result += '.';
        }

        const commaBefore = [
            'а',
            'но',
            'однако',
            'зато',
            'да',
            'или',
            'либо',
            'потому что',
            'так как',
            'чтобы',
            'что',
            'который',
            'когда',
            'где',
            'куда',
            'откуда',
            'как',
            'если',
        ];

        for (const word of commaBefore) {
            const regex = new RegExp(`\\s+${word}\\s+`, 'gi');
            result = result.replace(regex, `, ${word} `);
        }

        const commaAfter = [
            'кстати',
            'вообще',
            'в общем',
            'в принципе',
            'конечно',
            'конечно же',
            'разумеется',
            'безусловно',
            'возможно',
            'наверное',
            'наверно',
            'вероятно',
            'может быть',
        ];

        for (const word of commaAfter) {
            const regex = new RegExp(`\\s+${word}\\s+`, 'gi');
            result = result.replace(regex, `, ${word}, `);
        }

        const sentences = result.split(/[.!?]+/).filter((s) => s.trim());
        const processedSentences = sentences.map((sentence) => {
            const words = sentence.trim().split(/\s+/);
            if (words.length > 15) {
                const parts: string[] = [];
                for (let i = 0; i < words.length; i += 12) {
                    parts.push(words.slice(i, i + 12).join(' '));
                }
                return parts.join('. ') + '.';
            }
            return sentence.trim();
        });

        result = processedSentences.join('. ');

        result = result.replace(/[.!?]{2,}/g, '.');
        result = result.replace(/[,]{2,}/g, ',');

        result = result.replace(/(^|[.!?]\s+)([а-яё])/g, (match: string, p1: string, p2: string): string => {
            return p1 + p2.toUpperCase();
        });

        result = result.replace(/\s+([,.!?])/g, '$1');
        result = result.replace(/([,.!?])([^\s])/g, '$1 $2');

        return result.trim();
    }

    async processTranscriptionRequest(request: TranscriptionRequestDto): Promise<void> {
        try {
            const filePath = join(this.STORAGE_ROOT, request.chatId, request.fileId);

            let audioBuffer: Buffer;
            try {
                audioBuffer = readFileSync(filePath);
            } catch (fileError: unknown) {
                const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
                throw new Error(`File not found: ${filePath} - ${errorMessage}`);
            }

            const transcription = await this.transcribe(audioBuffer);

            const response: TranscriptionResponseDto = {
                fileId: request.fileId,
                transcription,
            };

            this.queueService.sendMessage(
                TopicsEnum.AUDIO_TRANSCRIPTION_RESPONSE,
                request.chatId,
                EventsEnum.AUDIO_TRANSCRIBED,
                DataResponse.success(response),
            );
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.queueService.sendMessage(
                TopicsEnum.AUDIO_TRANSCRIPTION_RESPONSE,
                request.chatId,
                EventsEnum.AUDIO_TRANSCRIBED,
                DataResponse.error(`Transcription failed: ${errorMessage}`),
            );
        }
    }
}
