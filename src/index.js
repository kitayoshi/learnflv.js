import FLVDemuxer from 'flv.js/src/demux/flv-demuxer';
import MP4Remuxer from 'flv.js/src/remux/mp4-remuxer';

const mediaElement = global.document.querySelector('video');

// meta for av4780424
const mediaDataSource = {
  url: 'av4780424.flv',
};

const mediaSource = new global.MediaSource();
mediaElement.src = global.URL.createObjectURL(mediaSource);

const sourceBuffer = {
  video: null,
  audio: null,
};

const pendingSourceBuffer = {
  video: [],
  audio: [],
};

const demuxer = new FLVDemuxer({});
const remuxer = new MP4Remuxer({});

demuxer.onError = () => {};
demuxer.onMediaInfo = () => {};

// pipeline
demuxer.onDataAvailable = remuxer.remux.bind(remuxer);
demuxer.onTrackMetadata = remuxer._onTrackMetadataReceived.bind(remuxer); // eslint-disable-line no-underscore-dangle, max-len

remuxer.onInitSegment = (type, segment) => {
  sourceBuffer[type] = mediaSource.addSourceBuffer(`${segment.container};codecs=${segment.codec}`);
  sourceBuffer[type].appendBuffer(segment.data);
  sourceBuffer[type].addEventListener('updateend', () => {
    if (pendingSourceBuffer[type].length) {
      sourceBuffer[type].appendBuffer((pendingSourceBuffer[type].shift()));
    }
  });
};
remuxer.onMediaSegment = (type, segment) => {
  pendingSourceBuffer[type].push(segment.data);
};

global.fetch(mediaDataSource.url).then(res => res.arrayBuffer()).then((arrayBuffer) => {
  demuxer.parseChunks(arrayBuffer, 0);
});
