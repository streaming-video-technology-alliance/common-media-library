import re

from ...structuredfield.utils.BARE_ITEM import BARE_ITEM
from .parseBoolean import parseBoolean
from .parseByteSequence import parseByteSequence
from .parseDate import parseDate
from .ParsedValue import ParsedValue
from .parseError import parseError
from .parseIntegerOrDecimal import parseIntegerOrDecimal
from .parseString import parseString
from .parseToken import parseToken


# 4.2.3.1.  Parsing a Bare Item
#
# Given an ASCII string as input_string, return a bare Item.
# input_string is modified to remove the parsed value.
#
# 1.  If the first character of input_string is a "-" or a DIGIT,
#     return the result of running Parsing an Integer or Decimal
#     (Section 4.2.4) with input_string.
#
# 2.  If the first character of input_string is a DQUOTE, return the
#     result of running Parsing a String (Section 4.2.5) with
#     input_string.
#
# 3.  If the first character of input_string is ":", return the result
#     of running Parsing a Byte Sequence (Section 4.2.7) with
#     input_string.
#
# 4.  If the first character of input_string is "?", return the result
#     of running Parsing a Boolean (Section 4.2.8) with input_string.
#
# 5.  If the first character of input_string is an ALPHA or "*", return
#     the result of running Parsing a Token (Section 4.2.6) with
#     input_string.
#
# 6.  If the first character of input_string is "@", return the result
#     of running Parsing a Date (Section 4.2.9) with input_string.
#
# 7.  Otherwise, the item type is unrecognized; fail parsing.
def parseBareItem(src):
    if not src:
        raise parseError(src, BARE_ITEM)

    first = src[0]

    if first == '"':
        return parseString(src)

    if re.search("^[-0-9]", first) != None:
        return parseIntegerOrDecimal(src)

    if first == "?":
        return parseBoolean(src)

    if first == ":":
        return parseByteSequence(src)

    if re.search("^[a-zA-Z*]", first) != None:
        return parseToken(src)

    if first == "@":
        return parseDate(src)

    raise parseError(src, BARE_ITEM)
