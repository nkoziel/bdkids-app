import { describe, it, expect } from 'vitest';
import {
  parseTomes, formatTomes, ownsTome, toggleTome, addRange,
  countTomes, missingTomes, gapTomes, isComplete,
  gridSize, lastOwned, GRID_MIN, GRID_SLACK,
} from '../src/core/tomes.js';

/* Ported from rayon-app's tests/volumes.test.js — same logic, "tome" instead of "volume". */

describe('parseTomes', () => {
  it.each([
    ['1-7,9,12-14', [1,2,3,4,5,6,7,9,12,13,14]],
    ['3',           [3]],
    ['1,2,3',       [1,2,3]],
    ['5-5',         [5]],
    ['',            []],
    [null,          []],
    [undefined,     []],
  ])('%s -> %j', (input, expected) => {
    expect(parseTomes(input)).toEqual(expected);
  });

  it('accepts a reversed range', () => {
    expect(parseTomes('7-1')).toEqual([1,2,3,4,5,6,7]);
  });

  it('tolerates whitespace and stray separators', () => {
    expect(parseTomes(' 1 - 3 , , 5 ')).toEqual([1,2,3,5]);
  });

  it('drops junk instead of throwing, since this can come from an imported file', () => {
    expect(parseTomes('abc,2,-,4')).toEqual([2,4]);
  });

  it('deduplicates overlapping ranges', () => {
    expect(parseTomes('1-5,3-7')).toEqual([1,2,3,4,5,6,7]);
  });

  it('refuses an absurd range rather than hanging', () => {
    expect(parseTomes('1-99999')).toEqual([]);
  });
});

describe('formatTomes — always the shortest canonical form', () => {
  it.each([
    [[1,2,3,5],            '1-3,5'],
    [[1],                  '1'],
    [[],                   ''],
    [[3,1,2],              '1-3'],
    [[1,1,2],              '1-2'],
    [[1,3,5],              '1,3,5'],
    [[1,2,3,4,5],          '1-5'],
  ])('%j -> %s', (input, expected) => {
    expect(formatTomes(input)).toBe(expected);
  });

  it('round-trips through parse without drift', () => {
    for (const s of ['1-7,9,12-14', '1', '', '2,4,6', '1-3,5-9']) {
      expect(formatTomes(parseTomes(s))).toBe(s);
    }
  });
});

describe('toggleTome', () => {
  it('adds a tome that is missing', () => {
    expect(toggleTome('1-3', 5)).toBe('1-3,5');
  });

  it('removes a tome that is owned', () => {
    expect(toggleTome('1-3', 2)).toBe('1,3');
  });

  it('closes a range when the added tome bridges it', () => {
    expect(toggleTome('1-3,5', 4)).toBe('1-5');
  });

  it('works from empty', () => {
    expect(toggleTome('', 1)).toBe('1');
  });
});

describe('addRange — "we own 1 to 12" in one gesture', () => {
  it('adds a whole run', () => {
    expect(addRange('', 1, 12)).toBe('1-12');
  });

  it('merges with what is already there', () => {
    expect(addRange('15', 1, 12)).toBe('1-12,15');
  });

  it('accepts the bounds in either order', () => {
    expect(addRange('', 12, 1)).toBe('1-12');
  });
});

describe('missingTomes — the shopping list for one series', () => {
  it('lists what is missing up to the known total', () => {
    expect(missingTomes('1-3,5', 6)).toEqual([4, 6]);
  });

  it('returns nothing when the collection is complete', () => {
    expect(missingTomes('1-6', 6)).toEqual([]);
  });

  it('does NOT guess when no total is known', () => {
    expect(missingTomes('1-3', 0)).toEqual([]);
    expect(missingTomes('1-3', null)).toEqual([]);
  });

  it('lists everything when nothing is owned yet', () => {
    expect(missingTomes('', 3)).toEqual([1, 2, 3]);
  });
});

describe('gapTomes — holes in the middle of a shelf', () => {
  it('finds a hole between owned tomes', () => {
    expect(gapTomes('1-3,5-7')).toEqual([4]);
  });

  it('ignores tomes above the highest owned one', () => {
    expect(gapTomes('1-3')).toEqual([]);
  });

  it('needs no total to work', () => {
    expect(gapTomes('1,5')).toEqual([2,3,4]);
  });
});

describe('countTomes / isComplete', () => {
  it('counts what is owned', () => {
    expect(countTomes('1-7,9')).toBe(8);
  });

  it('is complete only when a total is known and nothing is missing', () => {
    expect(isComplete('1-6', 6)).toBe(true);
    expect(isComplete('1-5', 6)).toBe(false);
    expect(isComplete('1-6', null)).toBe(false);
  });
});

describe('gridSize — the grid has to exist before any total is known', () => {
  it('offers a usable grid for an empty collection with no total', () => {
    expect(gridSize(0, 0)).toBe(GRID_MIN);
    expect(gridSize(null, 0)).toBe(GRID_MIN);
    expect(gridSize(undefined, 0)).toBe(GRID_MIN);
  });

  it('always runs past the last tome owned, so the next one is one tap away', () => {
    expect(gridSize(0, 20)).toBe(20 + GRID_SLACK);
    expect(gridSize(0, 7)).toBe(Math.max(7 + GRID_SLACK, GRID_MIN));
  });

  it('uses the total when there is one', () => {
    expect(gridSize(34, 12)).toBe(34);
  });

  it('never stops short of the collection, even past the published total', () => {
    expect(gridSize(34, 36)).toBe(36);
  });
});

describe('lastOwned', () => {
  it.each([['', 0], [null, 0], ['1-3', 3], ['1-3,9', 9], ['12', 12]])('%s -> %i', (s, n) => {
    expect(lastOwned(s)).toBe(n);
  });
});
