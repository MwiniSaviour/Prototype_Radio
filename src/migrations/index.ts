import * as migration_20261016_003104_initial from './20261016_003104_initial';
import * as migration_20261025_170252_pulse_radio from './20261025_170252_pulse_radio';

export const migrations = [
  {
    up: migration_20261016_003104_initial.up,
    down: migration_20261016_003104_initial.down,
    name: '20261016_003104_initial',
  },
  {
    up: migration_20261025_170252_pulse_radio.up,
    down: migration_20261025_170252_pulse_radio.down,
    name: '20261025_170252_pulse_radio'
  },
];
