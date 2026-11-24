const PLAYLIST_ID = 'PLZHNkTV1FW4c';

// Curated 18 tracks from the ET Radio playlist (PLZHNkTV1FW4c)
const DEFAULT_PLAYLIST = [
  { id: 'HfpR4tAmI7E', title: 'Love Me Not', artist: 'Ravyn Lenae' },
  { id: 'lFQdcPTTzSg', title: 'Dai Dai', artist: 'Shakira' },
  { id: 'icKzfie3Xhk', title: "Feet Don't Fail Me Now", artist: 'Joy Crookes' },
  { id: 'JkDCVLompxQ', title: 'Colors (Coca-Cola® Anthem)', artist: 'Jason Derulo' },
  { id: 'EfqsJm6BKng', title: 'Love Me Again', artist: 'John Newman' },
  { id: 'Qvu033SBMYU', title: 'Freed From Desire', artist: 'Gala' },
  { id: 'BLndCBgr55c', title: "You'll Never Walk Alone", artist: 'Gerry & The Pacemakers' },
  { id: 'jOF-P-vHQcc', title: 'Ramenez la coupe à la maison', artist: 'Vegedream' },
  { id: '6qI-va1F5ck', title: 'Dreamers (FIFA World Cup)', artist: 'Jung Kook' },
  { id: 'pRpeEdMmmQ0', title: 'Waka Waka (This Time for Africa)', artist: 'Shakira' },
  { id: 'WTJSt4wP2ME', title: "Wavin' Flag (Celebration Mix)", artist: "K'NAAN" },
  { id: 'pATX-lV0VFk', title: 'Live Is Life', artist: 'OPUS' },
  { id: 'LszrNDvIivU', title: 'Danza Kuduro', artist: 'Lucenzo' },
  { id: 'NTw5JiHBtEI', title: 'We Are One (Ole Ola)', artist: 'Pitbull' },
  { id: '8SvAif6uu6k', title: 'World Cup', artist: 'IShowSpeed' },
  { id: 'Pwd64EGQ1w0', title: 'Live It Up (FIFA World Cup)', artist: 'Nicky Jam' },
  { id: 'dHVs5Y_RU4o', title: 'Big Talk', artist: 'SOFY' },
  { id: 'CNDYWba7YDY', title: 'Y Que Fue?', artist: 'Don Miguelo' }
];

// State
let player = null;
let playerReady = false;
let isPlaying = false;
let hasStarted = false;
let activePlaylist = [...DEFAULT_PLAYLIST];
let shuffledIndices = [];
let currentQueueIndex = 0;
let consecutiveFailures = 0;
let isMuted = false;
let isCustomMode = false;
let customAudioElement = null;

// DOM Elements
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const muteBtn = document.getElementById('muteBtn');
const trackTitleEl = document.getElementById('trackTitle');
const stageEl = document.querySelector('.stage');
const drawerToggleBtn = document.getElementById('drawerToggleBtn');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const customListEl = document.getElementById('customTrackList');
const ytInputEl = document.getElementById('ytInput');
const addYtBtn = document.getElementById('addYtBtn');
const audioFileInput = document.getElementById('audioFileInput');
const addFileBtn = document.getElementById('addFileBtn');

// Icons
const PLAY_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>';
const PAUSE_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.5" height="14" rx="1"/><rect x="13.5" y="5" width="4.5" height="14" rx="1"/></svg>';
const MUTE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>';
const UNMUTE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';

// Fisher-Yates Shuffle
function shuffle(array, avoidFirst = -1) {
  const indices = Array.from({ length: array.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (avoidFirst >= 0 && indices.length > 1 && indices[0] === avoidFirst) {
    const swap = Math.floor(Math.random() * (indices.length - 1)) + 1;
    [indices[0], indices[swap]] = [indices[swap], indices[0]];
  }
  return indices;
}

const ERROR_DESCRIPTIONS = {
  2: 'bad parameter (2)',
  5: 'player error (5)',
  100: 'video not found (100)',
  101: 'embedding blocked (101)',
  150: 'embedding blocked (150)',
  153: 'missing referrer (153)'
};

// YouTube IFrame API Ready Callback
window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player('yt-player', {
    height: '240',
    width: '240',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      playsinline: 1,
      rel: 0,
      enablejsapi: 1,
      modestbranding: 1,
      origin: window.location.origin,
      widget_referrer: window.location.origin
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
};

function onPlayerReady(event) {
  playerReady = true;
  // If user already clicked play before iframe API finished loading
  if (hasStarted && isPlaying) {
    startPlayback();
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    consecutiveFailures = 0;
    updatePlayStateUI(true);
    updateTrackTitleFromPlayer();
    try {
      if (!isMuted && player) {
        player.unMute();
        player.setVolume(100);
      }
    } catch (e) {}
  } else if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    updatePlayStateUI(false);
  } else if (event.data === YT.PlayerState.ENDED) {
    // Loop forever on shuffle
    nextTrack(true);
  }
}

function onPlayerError(event) {
  const code = event.data;
  const meaning = ERROR_DESCRIPTIONS[code] || `player error (${code})`;
  console.log(`[YouTube Player onError]: Error ${code} - ${meaning}`);
  console.error(`YouTube Error ${code}: ${meaning}`);

  // Show error in UI
  trackTitleEl.textContent = `Error ${code}: ${meaning} — Skipping…`;
  trackTitleEl.title = `Error ${code}: ${meaning}`;

  consecutiveFailures++;

  if (consecutiveFailures >= activePlaylist.length) {
    // If every video failed, show "Reconnecting…" and retry
    setTimeout(() => {
      trackTitleEl.textContent = 'Reconnecting…';
      trackTitleEl.title = 'Reconnecting…';
      setTimeout(() => {
        consecutiveFailures = 0;
        shuffledIndices = shuffle(activePlaylist);
        currentQueueIndex = 0;
        loadAndPlayCurrentTrack();
      }, 3000);
    }, 1500);
  } else {
    // Automatically skip to the next track after a brief visible pause
    setTimeout(() => {
      nextTrack(true);
    }, 1200);
  }
}

function startPlayback() {
  if (!playerReady || !player) {
    hasStarted = true;
    isPlaying = true;
    updatePlayStateUI(true);
    return;
  }

  // First press: shuffle the playlist, start on random track with sound
  if (!hasStarted) {
    hasStarted = true;
    shuffledIndices = shuffle(activePlaylist);
    currentQueueIndex = 0;
  }

  loadAndPlayCurrentTrack();
}

function loadAndPlayCurrentTrack() {
  if (isCustomMode && activePlaylist[currentQueueIndex]?.isAudioFile) {
    playCustomAudio(activePlaylist[currentQueueIndex]);
    return;
  }

  if (customAudioElement) {
    customAudioElement.pause();
  }

  const trackIndex = shuffledIndices[currentQueueIndex] ?? 0;
  const track = activePlaylist[trackIndex];
  if (!track) return;

  const display = track.artist ? `${track.artist} — ${track.title}` : track.title;
  trackTitleEl.textContent = display;
  trackTitleEl.title = display;

  if (player && player.loadVideoById) {
    player.unMute();
    player.setVolume(100);
    player.loadVideoById(track.id);
    isPlaying = true;
    updatePlayStateUI(true);
  }
}

function updateTrackTitleFromPlayer() {
  try {
    if (!player || !player.getVideoData) return;
    const videoData = player.getVideoData();
    if (videoData && videoData.title) {
      const trackIndex = shuffledIndices[currentQueueIndex] ?? 0;
      const track = activePlaylist[trackIndex];
      let display = videoData.title;
      const artist = track?.artist || videoData.author;
      if (artist && !display.toLowerCase().includes(artist.toLowerCase())) {
        display = `${artist} — ${display}`;
      }
      trackTitleEl.textContent = display;
      trackTitleEl.title = display;
    }
  } catch (e) {}
}

function updatePlayStateUI(playing) {
  if (playing) {
    playBtn.innerHTML = PAUSE_ICON;
    playBtn.setAttribute('aria-label', 'Pause Extra Time');
    stageEl.classList.add('is-playing');
  } else {
    playBtn.innerHTML = PLAY_ICON;
    playBtn.setAttribute('aria-label', 'Play Extra Time');
    stageEl.classList.remove('is-playing');
  }
}

function togglePlay() {
  if (!hasStarted) {
    startPlayback();
    return;
  }

  if (isPlaying) {
    if (customAudioElement && !customAudioElement.paused) {
      customAudioElement.pause();
    }
    if (player && player.pauseVideo) {
      player.pauseVideo();
    }
    isPlaying = false;
    updatePlayStateUI(false);
  } else {
    if (customAudioElement && isCustomMode) {
      customAudioElement.play();
    } else if (player && player.playVideo) {
      player.playVideo();
    }
    isPlaying = true;
    updatePlayStateUI(true);
  }
}

function nextTrack(auto = false) {
  currentQueueIndex++;
  if (currentQueueIndex >= shuffledIndices.length) {
    // Loop forever: reshuffle when reaching the end of playlist
    const lastPlayed = shuffledIndices[shuffledIndices.length - 1];
    shuffledIndices = shuffle(activePlaylist, lastPlayed);
    currentQueueIndex = 0;
  }
  loadAndPlayCurrentTrack();
}

function prevTrack() {
  currentQueueIndex--;
  if (currentQueueIndex < 0) {
    currentQueueIndex = shuffledIndices.length - 1;
  }
  loadAndPlayCurrentTrack();
}

function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    if (player && player.mute) player.mute();
    if (customAudioElement) customAudioElement.muted = true;
    muteBtn.innerHTML = MUTE_ICON;
  } else {
    if (player && player.unMute) player.unMute();
    if (customAudioElement) customAudioElement.muted = false;
    muteBtn.innerHTML = UNMUTE_ICON;
  }
}

// Custom Playlist Drawer (Requirement 5: Saved in localStorage)
function loadCustomPlaylist() {
  try {
    const raw = localStorage.getItem('et_my_playlist');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomPlaylist(list) {
  try {
    localStorage.setItem('et_my_playlist', JSON.stringify(list));
  } catch (e) {}
}

function renderCustomPlaylist() {
  const customList = loadCustomPlaylist();
  customListEl.innerHTML = '';

  if (customList.length === 0) {
    customListEl.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:16px 0;">No custom tracks saved yet. Add a YouTube link or audio file above!</div>';
    return;
  }

  customList.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'custom-track-item';
    el.innerHTML = `
      <div class="custom-track-name" title="${item.title}">${item.title}</div>
      <div class="custom-track-actions">
        <button class="btn-play-item" title="Play Now" data-index="${index}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="btn-delete" title="Remove" data-index="${index}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `;

    el.querySelector('.btn-play-item').addEventListener('click', () => {
      playCustomTrack(item);
    });

    el.querySelector('.btn-delete').addEventListener('click', () => {
      removeCustomTrack(index);
    });

    customListEl.appendChild(el);
  });
}

function addYouTubeTrack(urlOrId) {
  let videoId = '';
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    videoId = trimmed;
  } else {
    const match = trimmed.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      videoId = match[1];
    }
  }

  if (!videoId) {
    alert('Please enter a valid YouTube Video URL or 11-character Video ID.');
    return;
  }

  const customList = loadCustomPlaylist();
  const newTrack = {
    id: videoId,
    title: `YouTube Track (${videoId})`,
    isAudioFile: false
  };

  customList.push(newTrack);
  saveCustomPlaylist(customList);
  renderCustomPlaylist();
  ytInputEl.value = '';
}

function removeCustomTrack(index) {
  const customList = loadCustomPlaylist();
  customList.splice(index, 1);
  saveCustomPlaylist(customList);
  renderCustomPlaylist();
}

function playCustomTrack(item) {
  if (item.isAudioFile) {
    playCustomAudio(item);
  } else {
    isCustomMode = false;
    hasStarted = true;
    if (player && player.loadVideoById) {
      player.loadVideoById(item.id);
      isPlaying = true;
      updatePlayStateUI(true);
      trackTitleEl.textContent = item.title;
      trackTitleEl.title = item.title;
    }
  }
  drawerBackdrop.classList.remove('active');
}

function playCustomAudio(track) {
  if (player && player.pauseVideo) {
    player.pauseVideo();
  }

  if (!customAudioElement) {
    customAudioElement = new Audio();
    customAudioElement.addEventListener('ended', () => nextTrack(true));
  }

  customAudioElement.src = track.url;
  customAudioElement.play();
  isPlaying = true;
  updatePlayStateUI(true);
  trackTitleEl.textContent = track.title;
  trackTitleEl.title = track.title;
}

// Parallax effect on mousemove
const bgLayer = document.querySelector('.l-bg');
const midLayer = document.querySelector('.layer-mid');
const fgLayer = document.querySelector('.layer-fg');

function handleMouseMove(e) {
  const r = document.querySelector('.hero-section').getBoundingClientRect();
  const mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  const my = ((e.clientY - r.top) / r.height - 0.5) * 2;

  if (bgLayer) bgLayer.style.transform = `translate3d(${(-mx * 5).toFixed(1)}px, ${(-my * 3).toFixed(1)}px, 0)`;
  if (midLayer) midLayer.style.transform = `translate3d(${(-mx * 11).toFixed(1)}px, ${(-my * 6).toFixed(1)}px, 0)`;
  if (fgLayer) fgLayer.style.transform = `translate3d(${(-mx * 18).toFixed(1)}px, ${(-my * 10).toFixed(1)}px, 0)`;
}

function handleMouseLeave() {
  if (bgLayer) bgLayer.style.transform = 'translate3d(0, 0, 0)';
  if (midLayer) midLayer.style.transform = 'translate3d(0, 0, 0)';
  if (fgLayer) fgLayer.style.transform = 'translate3d(0, 0, 0)';
}

// Event Listeners
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', () => nextTrack(false));
prevBtn.addEventListener('click', prevTrack);
muteBtn.addEventListener('click', toggleMute);

drawerToggleBtn.addEventListener('click', () => {
  drawerBackdrop.classList.add('active');
  renderCustomPlaylist();
});

drawerCloseBtn.addEventListener('click', () => {
  drawerBackdrop.classList.remove('active');
});

drawerBackdrop.addEventListener('click', (e) => {
  if (e.target === drawerBackdrop) {
    drawerBackdrop.classList.remove('active');
  }
});

addYtBtn.addEventListener('click', () => {
  if (ytInputEl.value) {
    addYouTubeTrack(ytInputEl.value);
  }
});

ytInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && ytInputEl.value) {
    addYouTubeTrack(ytInputEl.value);
  }
});

addFileBtn.addEventListener('click', () => {
  audioFileInput.click();
});

audioFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const objectUrl = URL.createObjectURL(file);
    const customList = loadCustomPlaylist();
    customList.push({
      id: `local-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      url: objectUrl,
      isAudioFile: true
    });
    saveCustomPlaylist(customList);
    renderCustomPlaylist();
    audioFileInput.value = '';
  }
});

const heroSec = document.querySelector('.hero-section');
if (heroSec) {
  heroSec.addEventListener('mousemove', handleMouseMove);
  heroSec.addEventListener('mouseleave', handleMouseLeave);
}

// Pre-populate initial track label (paused on page load)
const initialFirst = DEFAULT_PLAYLIST[Math.floor(Math.random() * DEFAULT_PLAYLIST.length)];
trackTitleEl.textContent = `${initialFirst.artist} — ${initialFirst.title}`;
trackTitleEl.title = `${initialFirst.artist} — ${initialFirst.title}`;

// Ensure YouTube IFrame API script is present
if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
  const ytScript = document.createElement('script');
  ytScript.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(ytScript);
}
