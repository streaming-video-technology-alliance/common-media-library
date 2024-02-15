from ...structuredfield.SfItem import SfItem
from ...structuredfield.utils.DICT import DICT
from .ParsedValue import ParsedValue
from .parseError import parseError
from .parseItemOrInnerList import parseItemOrInnerList
from .parseKey import parseKey
from .parseParameters import parseParameters


# 4.2.2.  Parsing a Dictionary
#
# Given an ASCII string as input_string, return an ordered map whose
# values are (item_or_inner_list, parameters) tuples. input_string is
# modified to remove the parsed value.
#
# 1.  Let dictionary be an empty, ordered map.
#
# 2.  While input_string is not empty:
#
#     1.  Let this_key be the result of running Parsing a Key
#         (Section 4.2.3.3) with input_string.
#
#     2.  If the first character of input_string is "=":
#
#         1.  Consume the first character of input_string.
#
#         2.  Let member be the result of running Parsing an Item or
#             Inner List (Section 4.2.1.1) with input_string.
#
#     3.  Otherwise:
#
#         1.  Let value be Boolean true.
#
#         2.  Let parameters be the result of running Parsing
#             Parameters Section 4.2.3.2 with input_string.
#
#         3.  Let member be the tuple (value, parameters).
#
#     4.  Add name this_key with value member to dictionary.  If
#         dictionary already contains a name this_key (comparing
#         character-for-character), overwrite its value.
#
#     5.  Discard any leading OWS characters from input_string.
#
#     6.  If input_string is empty, return dictionary.
#
#     7.  Consume the first character of input_string; if it is not
#         ",", fail parsing.
#
#     8.  Discard any leading OWS characters from input_string.
#
#     9.  If input_string is empty, there is a trailing comma; fail
#         parsing.
#
# 3.  No structured data has been found; return dictionary (which is
#     empty).
#
# Note that when duplicate Dictionary keys are encountered, this has
# the effect of ignoring all but the last instance.
def parseDict(src):
    value = {}

    # function toDict(entries: [string, SfItem | SfInnerList][]) {
    # 	return Object.fromEntries(entries);
    # }

    while len(src) > 0:
        member = None
        parsedKey = parseKey(src)
        this_key = parsedKey.value
        src = parsedKey.src
        if src[0] == "=":
            parsedItemOrInnerList = parseItemOrInnerList(src[1:])
            member = parsedItemOrInnerList.value
            src = parsedItemOrInnerList.src
        else:
            parsedParameters = parseParameters(src)
            member = SfItem(True, parsedParameters.value)
            src = parsedParameters.src

        value[this_key] = member
        src = src.strip()

        if len(src) == 0:
            return ParsedValue(value, src)

        if src[0] != ",":
            raise parseError(src, DICT)

        src = src[1:].strip()
        if len(src) == 0 or src[0] == ",":
            raise parseError(src, DICT)

    return ParsedValue(value, src)
