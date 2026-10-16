import * as migration_20261016_003104_initial from './20261016_003104_initial';

export const migrations = [
  {
    up: migration_20261016_003104_initial.up,
    down: migration_20261016_003104_initial.down,
    name: '20261016_003104_initial'
  },
];
