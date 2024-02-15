import re

from ...structuredfield.utils.KEY import KEY
from .ParsedValue import ParsedValue
from .parseError import parseError


# 4.2.3.3.  Parsing a Key
#
# Given an ASCII string as input_string, return a key. input_string is
# modified to remove the parsed value.
#
# 1.  If the first character of input_string is not lcalpha or "*",
#     fail parsing.
#
# 2.  Let output_string be an empty string.
#
# 3.  While input_string is not empty:
#
#     1.  If the first character of input_string is not one of lcalpha,
#         DIGIT, "_", "-", ".", or "*", return output_string.
#
#     2.  Let char be the result of consuming the first character of
#         input_string.
#
#     3.  Append char to output_string.
#
# 4.  Return output_string.
def parseKey(src):
    i = 0

    if not src or re.search("^[a-z*]$", src[i]) == None:
        raise parseError(src, KEY)

    value = ""

    while len(src) > i:
        if re.search(r"^[a-z0-9_\-.*]$", src[i]) == None:
            return ParsedValue(value, src[i:])

        value += src[i]
        i += 1

    return ParsedValue(value, src[i:])
