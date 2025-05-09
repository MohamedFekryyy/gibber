let Gibber = null

const Metronome = {
  shouldDraw: true,
  canvas: null,
  ctx: null,
  width: null,
  height: null,
  color: '#252525',
  beat: 0,
  widthMod: 1,
  activeColor: '#4ECDC4', // Teal color for the active beat
  
  draw(beat, beatsPerMeasure) {
    if (this.shouldDraw && this.ctx !== null) {
      const beatWidth = this.width / beatsPerMeasure / this.widthMod,
            beatPos = (beat) * beatWidth
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.width, this.height)
      
      // Draw inactive beats with low opacity
      this.ctx.globalAlpha = 0.2
      
      // Create gradient for background
      const bgGradient = this.ctx.createLinearGradient(0, 0, this.width, 0)
      bgGradient.addColorStop(0, '#292F36') // Dark blue-black
      bgGradient.addColorStop(1, '#4ECDC4') // Teal
      
      this.ctx.fillStyle = bgGradient
      this.ctx.fillRect(0, 0, this.width, this.height)
      
      // Draw active beat with higher opacity and cool colors
      this.ctx.globalAlpha = 0.9
      
      // Create gradient for active beat
      const activeGradient = this.ctx.createLinearGradient(beatPos, 0, beatPos + beatWidth, 0)
      
      // Different colors based on which beat it is for visual variety
      switch(beat) {
        case 0: // First beat - brightest
          activeGradient.addColorStop(0, '#FF6B6B') // Coral
          activeGradient.addColorStop(1, '#FFE66D') // Light yellow
          break
        case 1:
          activeGradient.addColorStop(0, '#4ECDC4') // Teal
          activeGradient.addColorStop(1, '#1A535C') // Dark teal
          break
        case 2:
          activeGradient.addColorStop(0, '#F7FFF7') // Off-white
          activeGradient.addColorStop(1, '#A8DADC') // Light blue
          break
        case 3:
          activeGradient.addColorStop(0, '#6B9080') // Sage green
          activeGradient.addColorStop(1, '#A4C3B2') // Light green
          break
      }
      
      this.ctx.fillStyle = activeGradient
      
      // Add shadow for glow effect
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
      this.ctx.shadowBlur = 5
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0
      
      // Draw the active beat indicator
      this.ctx.fillRect(beatPos, 0, beatWidth, this.height)
      
      // Reset shadow
      this.ctx.shadowBlur = 0
    }
  },

  clear() {
    this.beat = 0
    this.draw(0, 4)
  },

  tick(event) {
    const __beat = event.data.value % 4 
    if (__beat !== Metronome.beat) {
      Metronome.draw(__beat, 4)
      Metronome.beat = __beat
      Gibber.publish('metronome.tick', __beat)
    }
  },
  
  init(__Gibber) {
    Gibber = __Gibber
    Gibber.Audio.Gibberish.utilities.workletHandlers.beat = this.tick
    this.canvas = document.querySelector('#metronome')
    this.ctx = this.canvas.getContext('2d')
  
    // Set width to span the full header
    const header = document.querySelector('header')
    this.width = this.canvas.width = window.innerWidth / 2 // Half the window width for the metronome
    this.height = this.canvas.height = 6 // Fixed height to match the CSS
  
    Gibber.subscribe('clear', this.clear.bind(this))
    
    this.draw(0, 4)
    window.Metronome = this
    
    // Adjust metronome on window resize
    window.addEventListener('resize', () => {
      this.width = this.canvas.width = window.innerWidth / 2
      this.draw(this.beat, 4)
    })
  },
  
  off() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.shouldDraw = false
  },
  
  on() { 
    this.shouldDraw = true 
    this.draw(this.beat, 4)
  },
}

module.exports = Metronome
