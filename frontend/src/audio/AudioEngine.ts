import type { AudioState, RepeatMode, AudioEngineState, AudioContextType, AudioEngineOptions} from "../types";
import type { Track } from '../types';
import { API_BASE_URL } from '../config';


type StateListener = (state: AudioState) => void;


export class AudioEngine {
  private audio: HTMLAudioElement;
  private state: AudioEngineState; // Use extended state internally
  private listeners: Set<StateListener> = new Set();
  private options: AudioEngineOptions;

  // Listen-tracking: id of the in-progress Activity row for whatever is currently loaded,
  // so we can PATCH in the real duration_played once it stops/switches/ends.
  private currentActivityId: number | null = null;
  private readonly apiBaseUrl: string = API_BASE_URL;

  // Incremented on every load. playNextAt() awaits twice (URL resolution, then
  // play()), so a fast Next-Next can leave an older load finishing after a
  // newer one; the stale load must not write state. See playNextAt().
  private loadToken = 0;

  // Singleton pattern ensures only one instance exists across the app
  private static instance: AudioEngine | null = null;

  /**
   * Get current instance of Audio Engines
   * @param options 
   * @returns 
   */
  public static getInstance(options: AudioEngineOptions): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine(options);
    }
    return AudioEngine.instance;
  }

  /**
   * 
   * @param options 
   */
  private constructor(options: AudioEngineOptions) {
    this.options = options;
    this.audio = new Audio();
    
    // Initialize extended statere
    this.state = {
      isPlaying: false,
      hasQueue: false,
      currentTrackId: null,
      currentTime: 0,
      duration: 0,
      error: null,
      currentQueue: [],
      queueIndex: -1,
      shuffleMode: false,
      repeatMode: 'off',
      currentTrackMetadata: null,
    };

    this.setupAudioListeners();
  }

  /**
   * update current state to new state
   * @param updates 
   */
  private updateState(updates: Partial<AudioEngineState>) {
    // Merge updates into current state
    const newState = { ...this.state, ...updates };
    this.state = newState;
    
    // Notify listeners (they expect AudioState, which is a subset of AudioEngineState)
    this.listeners.forEach(listener => listener(this.state as AudioState));
  }

  /**
   * 
   * @param listener 
   * @returns 
   */
  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Return the full extended state
  public getState(): AudioEngineState {
    return this.state;
  }

  // ------------------------------ Queue Management ------------------------------

  /**
   * 
   * @param tracks 
   * @param startIndex 
   * @returns 
   */
  public setQueue(tracks: Track[], startIndex = 0) {
    
    // Stop any currently playing audio to clear state and buffer
    this.audio.pause();
    this.finalizeActivity(); // log the final duration for whatever was playing before we clear its src
    this.audio.src = ''; // Clear source so togglePlay knows it needs to load
    
    let finalTracks = [...tracks];

    if (!finalTracks || finalTracks.length === 0) {
      this.updateState({ 
        hasQueue: false, 
        queueIndex: -1, 
        currentTrackId: null, 
        isPlaying: false,
        currentQueue: []
      });
      return;
    }

    let indexToPlay = startIndex;

    // 1. Handle Shuffle first
    if (this.state.shuffleMode) {
      for (let i = finalTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalTracks[i], finalTracks[j]] = [finalTracks[j], finalTracks[i]];
      }
      // If shuffling, we typically start at the beginning of the new shuffled list 
      // unless you want to find the clicked track in the new shuffle.
      indexToPlay = 0; 
    } else {
      // 2. Handle Index Bounds for non-shuffled mode
      if (indexToPlay < 0) {
        indexToPlay = 0;
      } else if (indexToPlay >= finalTracks.length) {
        indexToPlay = finalTracks.length - 1;
      }
    }
    console.log("Setting queue:", tracks[indexToPlay]?.title, "at index:", indexToPlay);


    this.updateState({
      currentQueue: finalTracks,
      queueIndex: indexToPlay,
      hasQueue: true,
      isPlaying: false, // Explicitly false because we cleared src
      currentTrackId: null, // Clear ID until playback starts
      currentTime: 0,
      error: null,
    });

    if ('mediaSession' in navigator) {
       this.updateMediaSession();
    }
  }

  /**
   * Insert tracks so they play next — directly after whatever is
   * currently playing — rather than appending to the end of the queue.
   * If nothing is queued yet, this behaves like starting a fresh queue
   * at index 0 (but does not auto-play — callers can togglePlay()
   * themselves if desired).
   * @param tracks
   */
  public addToQueue(tracks: Track[]) {
    if (!tracks || tracks.length === 0) return;

    if (!this.state.hasQueue || this.state.currentQueue.length === 0) {
      this.updateState({
        currentQueue: [...tracks],
        queueIndex: 0,
        hasQueue: true,
      });
      return;
    }

    const insertAt = this.state.queueIndex + 1;
    const newQueue = [...this.state.currentQueue];
    newQueue.splice(insertAt, 0, ...tracks);

    this.updateState({
      currentQueue: newQueue,
    });
  }

  /** 
  * Remove a track from the queue
  * @param index Index in currentQueue
  */
  public removeFromQueue(index: number) {
    if (!this.state.hasQueue) return;
    
    const newQueue = [...this.state.currentQueue];
    // Can't remove the currently playing track easily without handling playback state too.
    // Usually you only remove "upcoming" tracks. 
    // If index === queueIndex, we might just stop or play next immediately.
    if (index === this.state.queueIndex) {
      // Just play next immediately
      this.playNext();
      return;
    }

    newQueue.splice(index, 1);
    
    // Adjust queueIndex if it was after the removed item
    let newIndex = this.state.queueIndex;
    if (index < this.state.queueIndex) {
      newIndex--;
    }
    // If we just removed an upcoming track, index stays same for subsequent items
    
    this.updateState({
      currentQueue: newQueue,
      queueIndex: newIndex,
      hasQueue: newQueue.length > 0
    });
  }

  /**
   * Reorder an upcoming track within the queue (drag & drop support).
   * Only tracks that come after the currently playing track may be moved,
   * and a track can never be dragged above the "next song" slot
   * (i.e. queueIndex + 1) — it can only ever be brought as far forward
   * as directly after the currently playing track.
   * @param fromIndex Index of the track being dragged
   * @param toIndex Desired destination index
   */
  public moveQueueItem(fromIndex: number, toIndex: number) {
    if (!this.state.hasQueue) return;

    const minIndex = this.state.queueIndex + 1;

    // Can't move the currently playing track (or anything at/behind it).
    if (fromIndex <= this.state.queueIndex || fromIndex >= this.state.currentQueue.length) return;

    const queue = [...this.state.currentQueue];

    let target = Math.max(minIndex, toIndex);
    target = Math.min(target, queue.length - 1);

    if (fromIndex === target) return;

    const [moved] = queue.splice(fromIndex, 1);
    queue.splice(target, 0, moved);

    // queueIndex itself never shifts here since both fromIndex and target
    // are strictly after it — the currently playing track's position and
    // identity are unaffected.
    this.updateState({ currentQueue: queue });
  }

  /**
   * Toggle Shuffle
   */
  public toggleShuffle() {
    const newMode = !this.state.shuffleMode;
    this.updateState({ shuffleMode: newMode });
    
    // If we have a queue and user toggles shuffle ON, reshuffle it now
    if (newMode && this.state.hasQueue && this.state.currentQueue.length > 0) {
      const currentTrackId = this.state.currentQueue[this.state.queueIndex]?.track_id;
      
      // Create shuffled copy
      const shuffled = [...this.state.currentQueue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Find the index of the currently playing track in the new shuffle to try and maintain position relative to it? 
      // Simpler: just play from start of new shuffle, or find current track and set index there.
      const currentIndexInShuffled = shuffled.findIndex(t => t.track_id === currentTrackId);
      
      this.updateState({
        currentQueue: shuffled,
        queueIndex: currentIndexInShuffled !== -1 ? currentIndexInShuffled : 0,
      });
    }
    if (this.state.isPlaying && this.state.currentTrackId !== null) {
      const currentPlaying = this.state.currentQueue[this.state.queueIndex];
      if (currentPlaying) this.updateMediaSession(currentPlaying);
    }
  }

  /**
   * Toggle Repeat
   */
  public toggleRepeat() {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(this.state.repeatMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.updateState({ repeatMode: nextMode });
  }

  // ------------------------------ Listening Activity Logging ------------------------------

  /**
   * Logs the start of a new listen. Fire-and-forget: playback shouldn't wait on this.
   * Stores the created activity_id so we can patch in the real duration later.
   */
  private startActivity(trackId: number) {
    fetch(`${this.apiBaseUrl}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        this.currentActivityId = data?.activity_id ?? null;
      })
      .catch((error) => {
        console.error('[AudioEngine] Failed to log listen start:', error);
        this.currentActivityId = null;
      });
  }

  /**
   * Pushes the elapsed playback time to the currently tracked activity row, without
   * clearing it (used for pause, so resuming keeps updating the same listen).
   */
  private updateActivityDuration() {
    if (this.currentActivityId === null) return;

    const activityId = this.currentActivityId;
    const durationPlayed = Math.round(this.audio.currentTime || 0);

    fetch(`${this.apiBaseUrl}/api/activity/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_played: durationPlayed }),
    }).catch((error) => {
      console.error('[AudioEngine] Failed to update listen duration:', error);
    });
  }

  /**
   * Finalizes the currently tracked listen (final duration push) and clears it, so the
   * next track started gets its own fresh activity row.
   */
  private finalizeActivity() {
    this.updateActivityDuration();
    this.currentActivityId = null;
  }

  // ------------------------------ Playback Logic ------------------------------

  /**
   * Pause the audio
   */
  public pause() {
    if (this.audio) {
      this.updateActivityDuration();
      this.audio.pause();
      this.updateState({ isPlaying: false });
    }
  }



  /**
   * 
   */

    private async playNextAt(targetIndex: number) {
    if (!this.state.hasQueue || !this.state.currentQueue.length) return;

    // Whatever was previously loaded is done (switching/skipping) - log its final duration.
    this.finalizeActivity();

    let currentIndex = targetIndex;

    // Wrap around or clamp logic should happen here or in setQueue
    if (currentIndex < 0) {
       currentIndex = this.state.repeatMode === 'all' ? this.state.currentQueue.length - 1 : 0;
    }
    if (currentIndex >= this.state.currentQueue.length) {
        if (this.state.repeatMode === 'off') {
            this.updateState({ currentTrackId: null, isPlaying: false, queueIndex: currentIndex }); // Note: index might be out of bounds
            return;
        } else if (this.state.repeatMode === 'all') {
            currentIndex = 0;
        } else {
             // Repeat one doesn't make sense here unless we are ending? Usually ended event handles one.
             this.updateState({ currentTrackId: null, isPlaying: false });
             return;
        }
    }

    const track = this.state.currentQueue[currentIndex];
    if (!track) return;

    // Claim this load. Any load started after this one invalidates it.
    const token = ++this.loadToken;

    try {
      let url: string | null = null;
      if (track.files && track.files.length > 0) {
        url = await this.options.getTrackUrl(track.files[0].storage_path_url);
      } else {
         // Fallback for direct URL tracks if applicable in your type definition
         // Assuming Track type might have a direct url? Your original code only used files.
         // If track has a 'url' property directly, use it. 
         // For now, sticking to your original logic:
      }

      if (!url) {
          console.error(`No URL found for track ${track.track_id}`);
          this.updateState({ error: 'Could not load audio source' });
          return;
      }

      // A newer load started while we were resolving the URL — drop this one.
      if (token !== this.loadToken) return;

      // ALWAYS set src when switching tracks or starting new. 
      // This ensures we don't accidentally resume an old buffered chunk from a different song if logic was flawed.
      this.audio.src = url;
      
      await this.audio.play();

      // Superseded while play() was starting — the newer load owns the state now.
      if (token !== this.loadToken) return;

      // Update state to reflect what we just started playing
      this.updateState({
        isPlaying: true,
        currentTrackId: track.track_id,
        currentTrackMetadata: track,
        queueIndex: currentIndex, // Ensure state matches reality
        hasQueue: true,
        currentTime: 0,
        error: null
      });
      
      this.updateMediaSession(track);
      this.startActivity(track.track_id); // log this listen

    } catch (error) {
      // Changing audio.src mid-play rejects the pending play() with an
      // AbortError. That's expected when a newer load took over, so don't
      // surface it as an error or stomp on the newer load's state.
      if (token !== this.loadToken) return;

      console.error('[AudioEngine] Play error:', error);
      this.updateState({
        error: 'Failed to play audio',
        isPlaying: false
      });
    }
  }


  /**
   * Plays the track at the current queueIndex. 
   * If queueIndex is out of bounds (e.g. end of list), it handles repeat logic internally via 'ended' event usually,
   * but if called explicitly and index is invalid, it stops.
   */
  public async playNext() {
    let nextIndex = this.state.queueIndex + 1;
    
    // Handle repeat logic for index calculation
    if (nextIndex >= this.state.currentQueue.length) {
       if (this.state.repeatMode === 'all') {
           nextIndex = 0;
       } else if (this.state.repeatMode === 'one') {
           nextIndex = this.state.queueIndex; // Repeat current
       } else {
           // End of queue, off mode
           this.updateState({ currentTrackId: null, isPlaying: false });
           return;
       }
    }

    await this.playNextAt(nextIndex);
  }

  /**
   * Plays a specific position in the queue (e.g. clicking a row in QueueList).
   *
   * Goes straight to playNextAt. Routing through playNext() would play
   * `index + 1`, because playNext() advances *relative* to queueIndex — so
   * setting queueIndex to `index` first and then calling it skipped a track.
   * @param index Position in currentQueue
   */
  public async playTrackAt(index: number) {
    if (index < 0 || index >= this.state.currentQueue.length) return;
    await this.playNextAt(index);
  }

  /**
   * Play Previous
   */
  public playPrevious() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0; 
      return;
    }

    const newIndex = this.state.queueIndex - 1;
    
    if (newIndex >= 0) {
      this.playNextAt(newIndex);
    }
  }

  /**
   * Toggle Play button to play song
   * @returns 
   */
  public togglePlay() {
    // 1. Something is playing → pause it.
    if (this.state.isPlaying && this.state.currentTrackId !== null) {
      this.pause();
      return;
    }

    if (!this.state.hasQueue || !this.state.currentQueue.length) {
      console.warn("No queue to play");
      return;
    }

    let indexToPlay = this.state.queueIndex;

    if (indexToPlay < 0) {
      indexToPlay = 0;
    } else if (indexToPlay >= this.state.currentQueue.length) {
      // We've run off the end of the queue.
      if (this.state.repeatMode === 'all') {
        indexToPlay = 0;
      } else {
        return; // Nothing left to play.
      }
    }

    const targetTrack = this.state.currentQueue[indexToPlay];
    if (!targetTrack) return;

    const isSameTrack = this.state.currentTrackId === targetTrack.track_id;

    // 2. The paused track is still loaded → resume it where it left off.
    //    audio.play() is a promise, so the old try/catch never caught a
    //    rejection here; handle it on the promise instead.
    if (isSameTrack && this.audio.src && !this.audio.ended) {
      this.audio.play()
        .then(() => this.updateState({ isPlaying: true }))
        .catch((error) => {
          console.error('[AudioEngine] Resume error:', error);
          this.updateState({
            error: 'Failed to resume audio',
            isPlaying: false
          });
        });
      return;
    }

    // 3. Otherwise load and start the target track.
    void this.playNextAt(indexToPlay);
  }

  /**
   * Get the Next Track Id
   * @returns 
   */
  public getNextTrackId(): number | null {
    const nextIndex = this.state.queueIndex + 1;
    if (nextIndex < this.state.currentQueue.length) {
      return this.state.currentQueue[nextIndex].track_id;
    }
    // Check repeat mode for last track logic
    if (this.state.repeatMode === 'all' && this.state.hasQueue) {
        return this.state.currentQueue[0].track_id;
    }
    return null;
  }

  /**
   *  Get the previous Track Id
   * @returns 
   */
  public getLastTrackId(): number | null {
     return this.state.currentQueue[this.state.queueIndex]?.track_id || null;
  }

  // ------------------------------ Helper Functions ------------------------------

  private updateMediaSession(trackToUse: Track | null = null) {
    const currentTrack = trackToUse || this.state.currentQueue?.[this.state.queueIndex];
    if (!('mediaSession' in navigator) || !currentTrack) return;

    // @ts-ignore
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Unknown Title',
      artist: 'Uknown Artist', //currentTrack.artist || 'Unknown Artist',
      album: 'Unknown Album', //currentTrack.album_name || 'Unknown Album',
      artwork: currentTrack.cover_art_url ? [{src: currentTrack.cover_art_url, sizes: "512x512", type: 'image/jpeg'}] : [] 
    });

    //handlers are definded and point to this instance
    // @ts-ignore
    navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
    // @ts-ignore
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    // @ts-ignore
    navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
    // @ts-ignore
    navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
  }

  private setupAudioListeners() {
    // Time update (progress)
    this.audio.addEventListener('timeupdate', () => {
      this.updateState({ currentTime: this.audio.currentTime });
    });

    // Metadata loaded (duration)
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateState({ duration: this.audio.duration });
    });

    // Error handling
    this.audio.addEventListener('error', (e) => {
      console.error('[AudioEngine] Playback error:', e);
      this.updateState({ 
        error: 'Failed to load audio',
        isPlaying: false 
      });
    });

    // Track ended - Handle Queue Logic Here
    this.audio.addEventListener('ended', async () => {
      if (!this.state.hasQueue) {
         this.finalizeActivity();
         this.updateState({ currentTrackId: null, isPlaying: false });
         return;
      }

      // Repeat-one: replay the same index. playNextAt reloads the source and
      // opens a fresh Activity row, so each repeat is counted as its own listen.
      if (this.state.repeatMode === 'one') {
        await this.playNextAt(this.state.queueIndex);
        return;
      }

      const nextIndex = this.state.queueIndex + 1;

      if (nextIndex >= this.state.currentQueue.length) {
        if (this.state.repeatMode === 'all') {
          await this.playNextAt(0);
          return;
        }
        // End of queue with repeat off — stop here.
        this.finalizeActivity();
        this.updateState({ currentTrackId: null, isPlaying: false });
        return;
      }

      // Resolve the destination once, then play it once.
      //
      // The previous version called playNext() (which advances *relative* to
      // queueIndex), then set queueIndex to the value it had already computed
      // and called playNext() a second time — so every track that finished
      // naturally advanced the queue by two.
      await this.playNextAt(nextIndex);
    });
  }

  /**
   * Stop Audio
   */
  public destroy() {
    this.finalizeActivity();
    this.audio.pause();
    this.audio.src = '';
    AudioEngine.instance = null;
  }

  /**
   * Seek to a time in seconds
   */
  public seek(time: number) {
    if(this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
      this.updateState({ currentTime: this.audio.currentTime });
    }
  }
  
  // Keep for backwards compatibility if needed, but prefer playNext/togglePlay
  public async play(_trackId: number) {
     // Fallback: If called with explicit trackId, it might just play that single track without queue context?
     // For now, let's make it set a temporary queue or just play. 
     // To avoid confusion, we'll just use the engine's internal getTrackUrl.
     await this.playNext(); // In a strict queue system, you don't usually call play(id) directly unless setting initial state.
  }
}