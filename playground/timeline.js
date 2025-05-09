// Timeline visualization for Gibber
// This module handles collecting musical event data and rendering the visualization

const TimelineViz = (function() {
  // Private variables
  let container;
  let contentEl;
  let gibberInstance;
  let instruments = new Map();
  let currentBeat = 0;
  let isRunning = false;
  let animationFrame;
  let isInitialized = false;
  let errorCount = 0;
  const MAX_ERRORS = 5; // After this many errors, timeline will disable itself

  // Color gradients for different instrument types
  const gradients = {
    'drums': 'linear-gradient(to right, #6A5ACD, #483D8B)',
    'synth': 'linear-gradient(to right, #4ECDC4, #2A9D8F)',
    'bass': 'linear-gradient(to right, #FF6B6B, #F4A261)',
    'effect': 'linear-gradient(to right, #FF66B2, #9D4EDD)',
    'default': 'linear-gradient(to right, #555, #333)'
  };

  // Instrument type detection - simple version
  function detectInstrumentType(instrument) {
    try {
      if (!instrument) return 'default';
      
      const name = (instrument.constructor && instrument.constructor.name) 
                  ? instrument.constructor.name.toLowerCase() 
                  : '';
      
      if (name.includes('drum')) return 'drums';
      if (name.includes('bass') || name === 'mono') return 'bass';
      if (name.includes('synth') || name.includes('fm') || name === 'synth') return 'synth';
      if (name.includes('delay') || name.includes('reverb') || name.includes('chorus')) return 'effect';
      
      return 'default';
    } catch (e) {
      return 'default'; // Fail gracefully
    }
  }

  // Initialize the timeline visualization
  function init(gibber) {
    // Guard against missing or invalid Gibber instance
    if (!gibber) {
      console.warn('Timeline visualization: Gibber instance not provided, visualization disabled');
      return null;
    }
    
    try {
      gibberInstance = gibber;
      container = document.getElementById('timeline-visualization');
      
      if (!container) {
        console.warn('Timeline visualization: Container not found, visualization disabled');
        return null;
      }
      
      contentEl = container.querySelector('.timeline-content');
      
      if (!contentEl) {
        console.warn('Timeline visualization: Content element not found, visualization disabled');
        return null;
      }
      
      // Only attach event listeners if we haven't already initialized
      if (!isInitialized) {
        // Safely subscribe to events
        try {
          // Use a safer event subscription approach
          if (gibber && typeof gibber.subscribe === 'function') {
            gibber.subscribe('clear', safeReset);
            
            // Only subscribe to metronome.tick if it exists and is working
            if (gibber.Environment && gibber.Environment.metronome) {
              gibber.subscribe('metronome.tick', safeUpdateOnTick);
            }
          }
        } catch (error) {
          console.warn('Timeline visualization: Error subscribing to events, continuing without event hooks', error);
        }
      
        // Initial state setup - do this safely
        setTimeout(() => {
          safeCollectInstruments();
          safeRender();
        }, 1000); // Delay initial collection to ensure audio engine is ready
        
        isInitialized = true;
        console.log('Timeline visualization initialized successfully');
      }
      
      return {
        init,
        reset: safeReset,
        start: safeStart,
        stop: safeStop
      };
    } catch (error) {
      console.error('Error initializing timeline visualization:', error);
      // Return empty methods that do nothing to prevent further errors
      return {
        init: () => null,
        reset: () => null,
        start: () => null,
        stop: () => null
      };
    }
  }

  // Wrapper functions that catch errors and track error count
  function safeReset() {
    try {
      reset();
    } catch (error) {
      handleError('reset', error);
    }
  }

  function safeUpdateOnTick(beat) {
    try {
      updateOnTick(beat);
    } catch (error) {
      handleError('updateOnTick', error);
    }
  }

  function safeCollectInstruments() {
    try {
      collectInstruments();
    } catch (error) {
      handleError('collectInstruments', error);
    }
  }

  function safeRender() {
    try {
      render();
    } catch (error) {
      handleError('render', error);
    }
  }

  function safeStart() {
    try {
      start();
    } catch (error) {
      handleError('start', error);
    }
  }

  function safeStop() {
    try {
      stop();
    } catch (error) {
      handleError('stop', error);
    }
  }

  // Central error handler that can disable timeline if too many errors
  function handleError(functionName, error) {
    errorCount++;
    console.warn(`Timeline visualization error in ${functionName}:`, error);
    
    // If we've had too many errors, disable the timeline
    if (errorCount > MAX_ERRORS) {
      console.error('Timeline visualization: Too many errors, disabling visualization');
      disableTimeline();
    }
  }

  // Function to completely disable the timeline if it's causing problems
  function disableTimeline() {
    try {
      // Unsubscribe from events
      if (gibberInstance && typeof gibberInstance.unsubscribe === 'function') {
        gibberInstance.unsubscribe('clear', safeReset);
        gibberInstance.unsubscribe('metronome.tick', safeUpdateOnTick);
      }
      
      // Stop animation loop
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      // Hide the timeline container
      if (container) {
        container.style.display = 'none';
      }
      
      // Reset state
      instruments.clear();
      isRunning = false;
      isInitialized = false;
      
      console.log('Timeline visualization has been disabled due to errors');
    } catch (e) {
      // Last resort error handling
      console.error('Failed to properly disable timeline:', e);
      
      // Try to hide the container anyway
      try {
        document.getElementById('timeline-visualization').style.display = 'none';
      } catch (e2) {
        // Nothing more we can do
      }
    }
  }

  // Reset the timeline when code is cleared
  function reset() {
    instruments.clear();
    currentBeat = 0;
    render();
  }

  // Update on each metronome tick
  function updateOnTick(beat) {
    currentBeat = beat;
    updateActiveStates();
    render();
  }

  // Collect active instruments from Gibber
  function collectInstruments() {
    instruments.clear();
    
    // Safely check global scope for instruments
    try {
      // If window is undefined, exit early
      if (typeof window === 'undefined') return;
      
      for (const key in window) {
        try {
          const obj = window[key];
          
          // Skip non-objects and internal properties
          if (!obj || typeof obj !== 'object' || key.startsWith('_') || 
              key === 'window' || key === 'document' || key === 'TimelineViz') {
            continue;
          }
          
          // More defensive check for Gibber audio object
          if (obj && obj.__wrapped__ && 
              typeof obj.note === 'object' && 
              typeof obj.note.seq === 'function') {
            
            let type = detectInstrumentType(obj.__wrapped__);
            let patterns = [];
            
            // More defensive pattern extraction
            if (obj.note && obj.note.seq) {
              try {
                // Only add if seq.values exists
                if (obj.note.seq.values) {
                  patterns.push({
                    property: 'note',
                    values: obj.note.seq.values,
                    timings: obj.note.seq.timings || []
                  });
                }
              } catch (e) {
                // Skip this pattern if we can't access it
                console.warn(`Timeline couldn't access pattern for ${key}`, e);
              }
            }
            
            // Add the instrument to our collection
            instruments.set(key, {
              name: key,
              type: type,
              object: obj,
              patterns: patterns,
              active: false
            });
          }
        } catch (objError) {
          // Skip this object and continue to the next one
          continue;
        }
      }
    } catch (error) {
      console.error('Error collecting instruments for timeline:', error);
    }
  }

  // Update which instruments are currently active
  function updateActiveStates() {
    try {
      // Re-collect instruments in case new ones were created
      collectInstruments();
      
      // Mark instruments as active if they're playing on this beat
      instruments.forEach((instrument) => {
        try {
          instrument.active = false;
          
          if (instrument.patterns && Array.isArray(instrument.patterns)) {
            instrument.patterns.forEach(pattern => {
              // Simplified active detection - could be enhanced with actual pattern analysis
              if (currentBeat % 4 === 0) {
                instrument.active = true;
              }
            });
          }
        } catch (instrError) {
          // Skip this instrument if we can't process it
        }
      });
    } catch (error) {
      console.warn('Error updating active states in timeline, continuing operation', error);
    }
  }

  // Render the timeline visualization
  function render() {
    // Guard against missing elements
    if (!contentEl) return;
    
    try {
      // Clear the content
      contentEl.innerHTML = '';
      
      // Create a lane for each instrument
      instruments.forEach((instrument, id) => {
        try {
          const lane = document.createElement('div');
          lane.className = 'timeline-lane';
          
          if (instrument.active) {
            lane.className += ' active';
          }
          
          // Set the gradient based on instrument type
          lane.style.background = gradients[instrument.type] || gradients.default;
          
          // Add the instrument name
          const nameEl = document.createElement('div');
          nameEl.className = 'lane-name';
          nameEl.textContent = instrument.name || 'Unnamed';
          lane.appendChild(nameEl);
          
          // Add the pattern visualization
          const patternEl = document.createElement('div');
          patternEl.className = 'lane-pattern';
          
          // Add pattern events visualization
          renderPatternEvents(patternEl, instrument);
          
          lane.appendChild(patternEl);
          
          // Add click handler for muting/soloing
          lane.addEventListener('click', () => {
            safeToggleMute(instrument);
          });
          
          contentEl.appendChild(lane);
        } catch (laneError) {
          // Skip this lane if there's an error
          console.warn('Error rendering lane in timeline', laneError);
        }
      });
      
      // Add a message if no instruments
      if (instruments.size === 0) {
        const message = document.createElement('div');
        message.style.padding = '20px';
        message.style.color = '#999';
        message.style.textAlign = 'center';
        message.style.fontSize = '12px';
        message.innerHTML = 'No instruments detected.<br>Create some music to see the timeline!';
        contentEl.appendChild(message);
      }
    } catch (error) {
      console.warn('Error rendering timeline, continuing operation', error);
    }
  }

  // Render the pattern events in a lane
  function renderPatternEvents(container, instrument) {
    if (!container || !instrument || !instrument.patterns) return;
    
    try {
      // Simple visualization for now - will be enhanced with actual pattern data
      if (Array.isArray(instrument.patterns) && instrument.patterns.length > 0) {
        // Create a basic pattern visualization
        for (let i = 0; i < 4; i++) {
          const event = document.createElement('div');
          event.className = 'pattern-event';
          event.style.left = `${i * 25}%`;
          event.style.width = '22%';
          
          // Make the current beat more visible
          if (i === currentBeat) {
            event.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
          }
          
          container.appendChild(event);
        }
      }
    } catch (error) {
      // Continue without rendering pattern events
    }
  }

  // Safely toggle mute for an instrument
  function safeToggleMute(instrument) {
    try {
      toggleMute(instrument);
    } catch (error) {
      handleError('toggleMute', error);
    }
  }

  // Toggle mute/solo for an instrument
  function toggleMute(instrument) {
    if (!instrument || !instrument.object) return;
    
    try {
      // Check if gain property exists and is accessible
      if (instrument.object.gain !== undefined) {
        const currentGain = typeof instrument.object.gain === 'number' ? 
                          instrument.object.gain : 
                          (instrument.object.gain && instrument.object.gain.value !== undefined ? 
                           instrument.object.gain.value : 1);
        
        const isMuted = currentGain === 0;
        
        if (isMuted) {
          // Unmute - carefully set gain back to 1
          if (typeof instrument.object.gain === 'number') {
            instrument.object.gain = 1;
          } else if (instrument.object.gain && typeof instrument.object.gain.value !== 'undefined') {
            instrument.object.gain.value = 1;
          }
        } else {
          // Mute - carefully set gain to 0
          if (typeof instrument.object.gain === 'number') {
            instrument.object.gain = 0;
          } else if (instrument.object.gain && typeof instrument.object.gain.value !== 'undefined') {
            instrument.object.gain.value = 0;
          }
        }
      }
      
      // Update the visualization
      render();
    } catch (error) {
      console.warn('Error toggling mute in timeline, continuing operation', error);
    }
  }

  // Start animation loop
  function start() {
    if (!isRunning) {
      isRunning = true;
      animate();
    }
  }

  // Stop animation loop
  function stop() {
    isRunning = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  // Animation loop for smooth updates
  function animate() {
    if (!isRunning) return;
    
    try {
      // Update visualization
      updateActiveStates();
      render();
      
      // Continue the animation loop
      animationFrame = requestAnimationFrame(animate);
    } catch (error) {
      console.error('Error in timeline animation loop:', error);
      stop(); // Stop animation if there's an error
    }
  }

  // Public API - Note we're returning the "safe" versions
  return {
    init,
    reset: safeReset,
    start: safeStart,
    stop: safeStop
  };
})();

module.exports = TimelineViz; 