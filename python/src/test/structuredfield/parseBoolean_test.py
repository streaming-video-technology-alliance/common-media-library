import unittest

from ...structuredfield.parse.parseBoolean import parseBoolean
from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.SfException import SfException


class TestDecodeSfItem(unittest.TestCase):
    def test_parseBoolean(self):
        self.assertEqual(parseBoolean("?0"), ParsedValue(False, ""))
        self.assertEqual(parseBoolean("?1"), ParsedValue(True, ""))
        self.assertRaises(SfException, parseBoolean, "")


# import assert from 'node:assert';
# import test from 'node:test';
# import { parseBoolean } from '../../src/structuredfield/parse/parseBoolean.js';

# test('parseBoolean', () => {
# 	assert.deepStrictEqual(parseBoolean('?0'), { value: false, src: '' });
# 	assert.deepStrictEqual(parseBoolean('?1'), { value: true, src: '' });
# 	assert.throws(() => parseBoolean(''), /failed to parse "" as Boolean/);
# });
