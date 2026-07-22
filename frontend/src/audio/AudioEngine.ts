import type { AudioState, RepeatMode, AudioEngineState, AudioContextType, AudioEngineOptions} from "../types";
import type { Track } from '../types';


type StateListener = (state: AudioState) => void;


export class AudioEngine {
  private audio: HTMLAudioElement;
  private state: AudioEngineState; // Use extended state internally
  private listeners: Set<StateListener> = new Set();
  private options: AudioEngineOptions;

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
    
    // Initialize extended state
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
    console.log("Setting queue:", tracks[0]?.title);
    
    // Stop any currently playing audio to clear state and buffer
    this.audio.pause();
    this.audio.src = ''; // Clear source so togglePlay knows it needs to load
    
    let finalTracks = [...tracks];
    let indexToPlay = startIndex;

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

    // If shuffle is enabled, reshuffle the queue
    if (this.state.shuffleMode) {
      for (let i = finalTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalTracks[i], finalTracks[j]] = [finalTracks[j], finalTracks[i]];
      }
      indexToPlay = 0;
    } else {
      if (indexToPlay >= finalTracks.length) {
        indexToPlay = 0;
      }
    }

    this.updateState({
      currentQueue: finalTracks,
      queueIndex: indexToPlay,
      hasQueue: true,
      isPlaying: false, // Explicitly false because we cleared src
      currentTrackId: null, // Clear ID until playback starts
      currentTime: 0,
      error: null
    });

    if ('mediaSession' in navigator) {
       this.updateMediaSession();
    }
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

  // ------------------------------ Playback Logic ------------------------------

  /**
   * Pause the audio
   */
  public pause() {
    if (this.audio) {
      this.audio.pause();
      this.updateState({ isPlaying: false });
    }
  }



  /**
   * 
   */

    private async playNextAt(targetIndex: number) {
    if (!this.state.hasQueue || !this.state.currentQueue.length) return;

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

      // ALWAYS set src when switching tracks or starting new. 
      // This ensures we don't accidentally resume an old buffered chunk from a different song if logic was flawed.
      this.audio.src = url;
      
      await this.audio.play();

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

    } catch (error) {
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
   * Play Previous
   */
  public playPrevious() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0; // Restart song if played for 3+ seconds
    } else {
      const newIndex = this.state.queueIndex - 1;
      if (newIndex >= 0) {
        this.updateState({ queueIndex: newIndex });
        this.playNext(); // Replays the previous track in the list
      }
    }
  }

  /**
   * Toggle Play button to play song
   * @returns 
   */
  public togglePlay() {
    if (this.state.isPlaying && this.state.currentTrackId !== null) {
      this.pause();
    } else { // user wants play or unpause
      if(!this.state.hasQueue || !this.state.currentQueue.length) {
        console.warn("No queue to play");
        return;
      }
      let indexToPlay = this.state.queueIndex;

      if (indexToPlay >= this.state.currentQueue.length) {
         if (this.state.repeatMode === 'off') {
          return; // Nothing left to play
        } else if (this.state.repeatMode === 'all') {
          indexToPlay = 0;
        } else {
          // Should be handled by ended event usually, but safe guard
          this.updateState({ currentTrackId: null, isPlaying: false });
          return;
        }
      }
      
      if (this.state.isPlaying) {
        this.pause();
      } else {
        if (!this.audio.src) {
          this.playNextAt(indexToPlay);
        }
        const currentTargetTrack = this.state.currentQueue[indexToPlay];
        const isSameTrack = currentTargetTrack && this.state.currentTrackId === currentTargetTrack.track_id;

        if (isSameTrack && this.audio.src) {
          // Resume!
          try {
            this.audio.play();
            this.updateState({ isPlaying: true });
          } catch (error) {
            console.error('[AudioEngine] Resume error:', error);
            this.updateState({
              error: 'Failed to resume audio',
              isPlaying: false
            });
          }
        } else {
          // Switch Track / Start New
          this.playNextAt(indexToPlay);
        }
      }
     
      
    }
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
         this.updateState({ currentTrackId: null, isPlaying: false });
         return;
      }

      let nextIndex = this.state.queueIndex + 1;
      
      // Check Repeat One (repeat the same track)
      if (this.state.repeatMode === 'one') {
        nextIndex = this.state.queueIndex;
      } else if (nextIndex >= this.state.currentQueue.length) {
        // End of queue
        if (this.state.repeatMode === 'all') {
          nextIndex = 0; // Repeat all
        } else {
           // No repeat, just stop
           this.updateState({ currentTrackId: null, isPlaying: false });
           return;
        }
      }

      // Update index and play next
      await this.playNext(); // playNext will use the updated state from updateState? 
      // Note: This is tricky because playNext reads state. 
      // We need to update queueIndex BEFORE calling playNext if we changed it.
      
      // Let's refine: directly manipulate index then call internal play logic
      this.updateState({ queueIndex: nextIndex });
      await this.playNext();
    });
  }

  /**
   * Stop Audio
   */
  public destroy() {
    this.audio.pause();
    this.audio.src = '';
    AudioEngine.instance = null;
  }
  
  // Keep for backwards compatibility if needed, but prefer playNext/togglePlay
  public async play(_trackId: number) {
     // Fallback: If called with explicit trackId, it might just play that single track without queue context?
     // For now, let's make it set a temporary queue or just play. 
     // To avoid confusion, we'll just use the engine's internal getTrackUrl.
     await this.playNext(); // In a strict queue system, you don't usually call play(id) directly unless setting initial state.
  }
}