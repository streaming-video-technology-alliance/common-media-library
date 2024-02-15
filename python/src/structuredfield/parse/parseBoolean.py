from ...structuredfield.utils.BOOLEAN import BOOLEAN
from .ParsedValue import ParsedValue
from .parseError import parseError


# 4.2.8.  Parsing a Boolean
#
# Given an ASCII string as input_string, return a Boolean. input_string
# is modified to remove the parsed value.
#
# 1.  If the first character of input_string is not "?", fail parsing.
#
# 2.  Discard the first character of input_string.
#
# 3.  If the first character of input_string matches "1", discard the
#     first character, and return true.
#
# 4.  If the first character of input_string matches "0", discard the
#     first character, and return false.
#
# 5.  No value has matched; fail parsing.
def parseBoolean(src):
    i = 0

    if not src or src[i] != "?":
        raise parseError(src, BOOLEAN)

    i += 1

    if src and src[i] == "1":
        i += 1
        return ParsedValue(True, src[i:])

    if src and src[i] == "0":
        i += 1
        return ParsedValue(False, src[i:])

    raise parseError(src, BOOLEAN)
