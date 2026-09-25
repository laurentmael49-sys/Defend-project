/**
 * In-memory Circuit Breaker pattern implementation for AI Service.
 * States: 'closed' (normal), 'open' (failing, block requests), 'half-open' (testing recovery).
 */

class CircuitBreaker {
  constructor() {
    this.state = 'closed' // 'closed' | 'open' | 'half-open'
    this.consecutiveFailures = 0
    this.nextAttemptTime = 0
  }

  getThreshold() {
    return parseInt(process.env.AI_CIRCUIT_FAILURE_THRESHOLD, 10) || 5
  }

  getResetMs() {
    return parseInt(process.env.AI_CIRCUIT_RESET_MS, 10) || 60000
  }

  getState() {
    if (this.state === 'open' && Date.now() >= this.nextAttemptTime) {
      const oldState = this.state
      this.state = 'half-open'
      console.log(`[CIRCUIT BREAKER] State changed: ${oldState} -> half-open`)
    }
    return this.state
  }

  canExecute() {
    const currentState = this.getState()
    return currentState !== 'open'
  }

  recordSuccess() {
    const oldState = this.state
    this.consecutiveFailures = 0
    this.state = 'closed'
    if (oldState !== 'closed') {
      console.log(`[CIRCUIT BREAKER] State changed: ${oldState} -> closed`)
    }
  }

  recordFailure() {
    this.consecutiveFailures += 1
    const threshold = this.getThreshold()
    const resetMs = this.getResetMs()

    if (this.state === 'half-open') {
      const oldState = this.state
      this.state = 'open'
      this.nextAttemptTime = Date.now() + resetMs
      console.log(`[CIRCUIT BREAKER] State changed: ${oldState} -> open (Failed in half-open state. Cooldown: ${resetMs / 1000}s)`)
    } else if (this.consecutiveFailures >= threshold) {
      const oldState = this.state
      this.state = 'open'
      this.nextAttemptTime = Date.now() + resetMs
      console.log(`[CIRCUIT BREAKER] State changed: ${oldState} -> open (${this.consecutiveFailures} consecutive failures. Cooldown: ${resetMs / 1000}s)`)
    }
  }

  // Helper method for dev testing / simulation
  forceState(newState) {
    const oldState = this.state
    this.state = newState
    if (newState === 'open') {
      this.nextAttemptTime = Date.now() + this.getResetMs()
    }
    console.log(`[CIRCUIT BREAKER SIMULATION] Forced state: ${oldState} -> ${newState}`)
  }
}

const aiCircuitBreaker = new CircuitBreaker()
module.exports = { aiCircuitBreaker }
