import { isValidTagName } from './html-writer';

it('Should be able to filter out invalid tag names', () => {
  expect(isValidTagName('a')).toBe(true);
  expect(isValidTagName('h1')).toBe(true);
  expect(isValidTagName('h5')).toBe(true);
  expect(isValidTagName('h0')).toBe(true);
  expect(isValidTagName('1h')).toBe(false);
  expect(isValidTagName('-span')).toBe(false);
  expect(isValidTagName('div-')).toBe(false);
  expect(isValidTagName('custom-tag')).toBe(true);
  expect(isValidTagName('%=')).toBe(false);
  expect(isValidTagName('div')).toBe(true);
  expect(isValidTagName('__IgEyE-EbwyE__')).toBe(true);
  expect(isValidTagName('_f_')).toBe(true);
  expect(isValidTagName('-span-')).toBe(false);
});
