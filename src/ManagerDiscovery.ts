/**
 * Simple Manager Discovery Service for React Native
 * 
 * Always connects to the main manager endpoint which handles
 * all routing and load balancing transparently.
 */
class ManagerDiscovery {
  private managerUrl: string = 'https://connect.oddsockets.tyga.network';

  /**
   * Get the manager URL (always returns the main endpoint)
   * @param apiKey - The OddSockets API key (not used, kept for compatibility)
   * @returns Promise resolving to the manager URL
   */
  async discoverManagerUrl(apiKey: string): Promise<string> {
    return this.managerUrl;
  }

  /**
   * Clear cache (no-op, kept for compatibility)
   */
  clearCache(): void {
    // No cache to clear in simplified version
  }
}

// Singleton instance
const managerDiscovery = new ManagerDiscovery();

export default managerDiscovery;
