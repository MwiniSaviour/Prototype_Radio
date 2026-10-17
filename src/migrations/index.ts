import * as migration_20261016_003104_initial from './20261016_003104_initial';
import * as migration_20261017_204540 from './20261017_204540';

export const migrations = [
  {
    up: migration_20261016_003104_initial.up,
    down: migration_20261016_003104_initial.down,
    name: '20261016_003104_initial',
  },
  {
    up: migration_20261017_204540.up,
    down: migration_20261017_204540.down,
    name: '20261017_204540'
  },
];
