import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { getRandomApiKey } from '@/lib/api-keys';

export const runtime = 'nodejs';

const PROTO_ROOT = path.join(process.cwd(), 'src', 'lib', 'riva');
const PROTO_DIR = path.join(PROTO_ROOT, 'proto');
const PROTO_WORKSPACE_ROOT = path.join(process.cwd(), 'src', 'lib');
const PROTO_PATH = path.join(PROTO_DIR, 'riva_asr.proto');

const DEFAULT_FUNCTION_ID = 'b702f636-f60c-4a3d-a6f4-f3568c13bd7d';
const DEFAULT_ENDPOINT = 'grpc.nvcf.nvidia.com:443';

const loadAsrService = () => {
  if (!fs.existsSync(PROTO_PATH)) {
    throw new Error(
      `Missing Riva proto. Place riva_asr.proto (and dependencies) in ${PROTO_DIR}.`
    );
  }

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_WORKSPACE_ROOT, PROTO_ROOT, PROTO_DIR],
  });

  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
  const serviceCandidates = [
    grpcObject?.riva?.asr?.RivaSpeechRecognition,
    grpcObject?.riva?.RivaSpeechRecognition,
    grpcObject?.nvidia?.riva?.asr?.RivaSpeechRecognition,
    grpcObject?.riva_asr?.RivaSpeechRecognition,
  ].filter(Boolean);

  if (serviceCandidates.length === 0) {
    throw new Error('Unable to locate RivaSpeechRecognition service in loaded proto.');
  }

  return serviceCandidates[0];
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mimeType = (formData.get('mimeType') as string) || file?.type || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const Service = loadAsrService();
    const endpoint = process.env.RIVA_GRPC_ENDPOINT || DEFAULT_ENDPOINT;
    const functionId = process.env.RIVA_ASR_FUNCTION_ID || process.env.NVIDIA_NIM_ASR_FUNCTION_ID || DEFAULT_FUNCTION_ID;

    console.debug(`ASR Client: endpoint=${endpoint}, functionId=${functionId}`);

    const client = new Service(
      endpoint,
      grpc.credentials.createSsl(),
      {
        'grpc.max_receive_message_length': 50 * 1024 * 1024,
        'grpc.max_send_message_length': 50 * 1024 * 1024,
      }
    );

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${getRandomApiKey()}`);
    metadata.set('function-id', functionId);

    const audioBytesRaw = Buffer.from(await file.arrayBuffer());
    let audioBytes = audioBytesRaw;

    // Robustness: If the file has a WAV header but we are treating it as LINEAR_PCM,
    // strip the 44-byte header to prevent noise.
    if (audioBytesRaw.length > 44 && audioBytesRaw.slice(0, 4).toString() === 'RIFF') {
      console.debug('Stripping WAV header from ASR input');
      audioBytes = audioBytesRaw.slice(44);
    }

    let encoding = process.env.RIVA_ASR_ENCODING;
    if (!encoding) {
      if (mimeType.includes('ogg')) encoding = 'OGGOPUS';
      else if (mimeType.includes('flac')) encoding = 'FLAC';
      else if (mimeType.includes('wav')) encoding = 'LINEAR_PCM';
      else if (mimeType.includes('l16')) encoding = 'LINEAR_PCM';
      else if (mimeType.includes('pcm')) encoding = 'LINEAR_PCM';
      else if (mimeType.includes('webm')) encoding = 'OGGOPUS';
      else encoding = 'ENCODING_UNSPECIFIED';
    }
    const languageCode = process.env.RIVA_ASR_LANGUAGE_CODE || 'en-US';
    const sampleRateHz = Number(process.env.RIVA_ASR_SAMPLE_RATE_HZ || 16000); 
    const modelName = process.env.RIVA_ASR_MODEL || '';

    console.debug(`ASR Request: mimeType=${mimeType}, encoding=${encoding}, sampleRate=${sampleRateHz}, bytes=${audioBytes.length}`);

    const request = {
      config: {
        encoding,
        language_code: languageCode,
        sample_rate_hertz: sampleRateHz,
        audio_channel_count: 1,
        enable_automatic_punctuation: true,
        max_alternatives: 1,
        ...(modelName ? { model: modelName } : {}),
      },
      audio: audioBytes,
    };

    const response = await new Promise<any>((resolve, reject) => {
      client.Recognize(request, metadata, (err: grpc.ServiceError, res: any) => {
        if (err) {
          console.error('Riva gRPC Error (Recognize):', err);
          return reject(err);
        }
        console.debug('Riva gRPC Response (Recognize) Success:', JSON.stringify(res).substring(0, 500));
        resolve(res);
      });
    });

    const transcript =
      response?.results?.[0]?.alternatives?.[0]?.transcript ||
      response?.results?.[0]?.alternatives?.[0]?.transcript_text ||
      response?.transcript;

    if (!transcript) {
      return NextResponse.json({ error: 'No transcription text returned', raw: response }, { status: 502 });
    }

    return NextResponse.json({ text: transcript });
  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
