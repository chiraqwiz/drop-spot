import {
  IvsClient,
  CreateChannelCommand,
  GetStreamKeyCommand,
  StopStreamCommand,
  DeleteChannelCommand,
  GetStreamCommand,
} from '@aws-sdk/client-ivs';

export function isIvsConfigured() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

let client: IvsClient | null = null;

export function getIvsClient() {
  if (!client) {
    client = new IvsClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export type CreatedIvsChannel = {
  channelArn: string;
  ingestEndpoint: string;
  playbackUrl: string;
  streamKeyArn: string;
};

export async function createIvsChannel(name: string): Promise<CreatedIvsChannel> {
  const ivs = getIvsClient();
  const res = await ivs.send(
    new CreateChannelCommand({ name, latencyMode: 'LOW', type: 'BASIC' })
  );
  const channel = res.channel;
  if (!channel?.arn || !channel?.ingestEndpoint || !channel?.playbackUrl || !res.streamKey?.arn) {
    throw new Error('IVS did not return a complete channel');
  }
  return {
    channelArn: channel.arn,
    ingestEndpoint: channel.ingestEndpoint,
    playbackUrl: channel.playbackUrl,
    streamKeyArn: res.streamKey.arn,
  };
}

export async function getIvsStreamKey(streamKeyArn: string): Promise<string> {
  const ivs = getIvsClient();
  const res = await ivs.send(new GetStreamKeyCommand({ arn: streamKeyArn }));
  const key = res.streamKey?.value;
  if (!key) throw new Error('IVS did not return a stream key');
  return key;
}

export async function getIvsViewerCount(channelArn: string): Promise<number | null> {
  try {
    const ivs = getIvsClient();
    const res = await ivs.send(new GetStreamCommand({ channelArn }));
    return typeof res.stream?.viewerCount === 'number' ? res.stream.viewerCount : null;
  } catch {
    return null;
  }
}

export async function stopIvsChannel(channelArn: string): Promise<void> {
  const ivs = getIvsClient();
  try {
    await ivs.send(new StopStreamCommand({ channelArn }));
  } catch {
    // already stopped or never started — not fatal
  }
  try {
    await ivs.send(new DeleteChannelCommand({ arn: channelArn }));
  } catch {
    // best effort cleanup
  }
}
