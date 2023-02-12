import * as vite from "vite";
import { MULTIBUILD_COMPLETE_PLUGIN_NAME } from "../constants";
import Lock from "async-lock";

/**
 * Generate plugins that track how many builds are in progress at a single time, and their statuses
 * (error or success). After no more builds are running, and all builds have a success status,
 * the `onBuildsSucceeded` callback will be invoked.
 */
export function createMultibuildCompleteManager(
  onBuildsSucceeded: () => Promise<void> | void
) {
  let activeBuilds = 0;
  const buildStatuses: { [buildId: number]: Error } = {};
  let nextBuildId = 0;
  let hasTriggeredCallback = false;

  const lock = new Lock();
  const lockKey = "builds";

  function incrementBuildCount(buildId: number) {
    return lock.acquire(lockKey, () => {
      activeBuilds++;
      hasTriggeredCallback = false;
      delete buildStatuses[buildId];
    });
  }
  function decreaseBuildCount(buildId: number, err: Error | undefined) {
    return lock.acquire(lockKey, async () => {
      activeBuilds--;
      if (err == null) delete buildStatuses[buildId];
      else buildStatuses[buildId] = err;
    });
  }
  /**
   * Make sure the builds are completed and there are no errors, then call the callback.
   */
  function checkCompleted() {
    return lock.acquire(lockKey, async () => {
      if (
        activeBuilds === 0 &&
        Object.values(buildStatuses).length === 0 &&
        !hasTriggeredCallback
      ) {
        hasTriggeredCallback = true;
        await onBuildsSucceeded();
      }
    });
  }

  return {
    plugin(): vite.Plugin {
      const buildId = nextBuildId++;
      // Increment initially because we know there is a build queued up
      incrementBuildCount(buildId);
      let hasBuildOnce = false;
      return {
        name: MULTIBUILD_COMPLETE_PLUGIN_NAME,
        enforce: "post",
        async buildStart() {
          // Skip incrementing the first time since we already did it when the plugin was created
          if (hasBuildOnce) await incrementBuildCount(buildId);
          hasBuildOnce = true;
        },
        /**
         * This hook is called regardless of if the build threw an error, so it's the only reliable
         * place that can decrement the build counter regardless of build success.
         */
        async buildEnd(err) {
          await decreaseBuildCount(buildId, err);
        },
        /**
         * Call the completed callback AFTER the bundle has closed, so output files have been
         * written to the disk.
         *
         * This is only called on success. Only when the SLOWEST build finishes on success. So we
         * still need to check to make sure all builds have finished and were successful. We also
         * only want to cal the callback from one of the plugin instances, not all of them. So we
         * only call the callback from the first plugin instance that finished.
         */
        async closeBundle() {
          await checkCompleted();
        },
      };
    },
  };
}
