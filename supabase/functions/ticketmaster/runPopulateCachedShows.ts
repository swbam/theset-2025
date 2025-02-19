import { populateCachedShows } from './populateCachedShows.ts';

(async () => {
  try {
    console.log('Starting to populate cached shows...');
    await populateCachedShows();
    console.log('Finished populating cached shows.');
  } catch (error) {
    console.error('Error while populating cached shows:', error);
  }
})();