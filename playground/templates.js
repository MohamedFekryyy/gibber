// Templates.js - Starter templates for Gibber
// This file contains the template code examples and the functionality
// for the intro overlay selection component

const Templates = {
  // Individual examples
  templateCode: {
    'techno-fourfour': `// Four-on-the-floor techno beat
technoBeat = Drums('x*x*x*x*')`,
    
    'acid-bass': `// Squelchy acid bassline riff
acidBass = Synth('acidBass')
acidBass.note.seq([0, 7, 4, 7], 1/8)`,
    
    'lofi-beat': `// Chill lo-fi hip hop groove with mellow keys
lofiBeat = Drums('x.o.x.o.')        // x=kick, o=snare
lofiKeys = Synth()
lofiKeys.note.seq([0, -2], 1/2)
lofiKeys.fx.add(Reverb())`,
    
    'ambient-pad': `// Soothing ambient pad that drifts in space
ambientPad = Synth()
ambientPad.note.seq([0, 2, 4, 3], [1, 0.5, 0.5, 2])
ambientPad.fx.add(Reverb(), Delay())`,
    
    'pattern-rotate-transpose': `// Evolving melody by rotating and transposing a pattern
p = [0, 2, 4, 6]
mel = Synth().note.seq(p, 1/8)
p.rotate(2)      // shift order
p.transpose(-2)  // move pitches down`,
    
    // Track templates (combinations)
    'techno-starter': `// Rapid Techno Jam
// Four-on-the-floor beat with acid bassline

technoBeat = Drums('x*x*x*x*')
hat = Hat({ decay:.05 }).trigger.seq([1,0.5], 1/8)

acidBass = Synth('acidBass')
acidBass.note.seq([0, 7, 4, 7], 1/8)

// Add some reverb
verb = Reverb('space').bus()
acidBass.connect(verb, 0.2)`,
    
    'lofi-chill': `// Lo-Fi Study Loop
// Laid-back beat with ambient keys

lofiBeat = Drums('x.o.x.o.')        // x=kick, o=snare
lofiKeys = Synth('pad')
lofiKeys.note.seq([0, -2], 1/2)

// Create effects chain
verb = Reverb('space').bus()
delay = Delay('1/4').bus().connect(verb, 0.3)
lofiKeys.connect(verb, 0.4)
lofiKeys.connect(delay, 0.2)`,
    
    'ambient-evolve': `// Evolving Drone
// Ambient pad with pattern manipulation

// Create a pad synth
ambientPad = Synth('pad')
ambientPad.gain = 0.4

// Create a pattern and sequence it
p = [0, 2, 4, 6]
ambientPad.note.seq(p, [4,2])

// Add rotation and transposition over time
Clock.every(8, () => {
  p.rotate(1)    // shift order
})

Clock.every(16, () => {
  p.transpose(Math.random() > 0.5 ? 2 : -2)  // move pitches
})

// Effects chain
verb = Reverb({ roomSize: 0.9 }).bus()
delay = Delay('1/3').bus().connect(verb, 0.5)
ambientPad.connect(verb, 0.7)
ambientPad.connect(delay, 0.3)`
  },

  // Initialize the intro overlay functionality
  init(cm) {
    // Get DOM elements
    const introOverlay = document.getElementById('intro-overlay');
    const startBlankBtn = document.getElementById('start-blank');
    const templateCards = document.querySelectorAll('.template-card');
    const trackTemplateCards = document.querySelectorAll('.track-template-card');
    
    if (!introOverlay || !startBlankBtn) {
      console.error('Template UI elements not found in the DOM');
      return;
    }
    
    // Function to close the intro overlay - using direct DOM manipulation
    // to ensure it actually hides
    const closeIntro = () => {
      // Force hide with DOM manipulation in addition to removing class
      introOverlay.classList.remove('active');
      introOverlay.style.opacity = '0';
      introOverlay.style.visibility = 'hidden';
      introOverlay.style.display = 'none'; // Force hide
      console.log('Template selection closed');
    };
    
    // Function to load a template
    const loadTemplate = (templateId) => {
      if (this.templateCode[templateId]) {
        // Set the editor content to the template code
        cm.setValue(this.templateCode[templateId]);
        
        // Close the intro overlay immediately
        closeIntro();
        
        // Focus the editor
        setTimeout(() => {
          cm.focus();
        }, 50);
      } else {
        console.error(`Template ID not found: ${templateId}`);
      }
    };
    
    // Event listener for "Start with blank page" button
    if (startBlankBtn) {
      startBlankBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event propagation
        
        // Set blank starting code
        cm.setValue(`// Welcome to Gibber!
// Start coding here...`);
        
        // Close the intro overlay
        closeIntro();
        
        // Focus the editor
        setTimeout(() => {
          cm.focus();
        }, 50);
      });
    }
    
    // Add event listeners to template cards
    templateCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event propagation
        
        const templateId = card.getAttribute('data-id');
        console.log(`Template selected: ${templateId}`);
        loadTemplate(templateId);
      });
    });
    
    // Add event listeners to track template cards
    trackTemplateCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event propagation
        
        const templateId = card.getAttribute('data-id');
        console.log(`Track template selected: ${templateId}`);
        loadTemplate(templateId);
      });
    });
    
    // Add explicit close button functionality
    const closeButton = document.createElement('button');
    closeButton.className = 'intro-close-btn';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close template selection');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '15px';
    closeButton.style.fontSize = '24px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = 'var(--f_med, #888)';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.lineHeight = '1';
    closeButton.style.zIndex = '10';
    
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeIntro();
    });
    
    const introContainer = document.querySelector('.intro-container');
    if (introContainer) {
      introContainer.appendChild(closeButton);
    }
    
    // Allow clicking outside the intro container to close it
    introOverlay.addEventListener('click', (event) => {
      // Only close if the click was directly on the overlay, not on the container
      if (event.target === introOverlay) {
        closeIntro();
      }
    });
    
    console.log('Templates UI initialized');
  },
  
  // Method to hide the intro overlay programmatically
  hide() {
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay) {
      introOverlay.classList.remove('active');
      introOverlay.style.opacity = '0';
      introOverlay.style.visibility = 'hidden';
      introOverlay.style.display = 'none'; // Force hide
      console.log('Template selection hidden programmatically');
    }
  },
  
  // Method to show the intro overlay programmatically
  show() {
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay) {
      // Reset any direct style properties that might have been set
      introOverlay.style.display = '';
      introOverlay.style.opacity = '';
      introOverlay.style.visibility = '';
      
      // Then add the active class
      introOverlay.classList.add('active');
      console.log('Template selection shown programmatically');
    }
  }
};

module.exports = Templates; 