from ...structuredfield.utils.LIST import LIST
from .ParsedValue import ParsedValue
from .parseError import parseError
from .parseItemOrInnerList import parseItemOrInnerList


# 4.2.1.  Parsing a List
#
# Given an ASCII string as input_string, return an array of
# (item_or_inner_list, parameters) tuples. input_string is modified to
# remove the parsed value.
#
# 1.  Let members be an empty array.
#
# 2.  While input_string is not empty:
#
#     1.  Append the result of running Parsing an Item or Inner List
#         (Section 4.2.1.1) with input_string to members.
#
#     2.  Discard any leading OWS characters from input_string.
#
#     3.  If input_string is empty, return members.
#
#     4.  Consume the first character of input_string; if it is not
#         ",", fail parsing.
#
#     5.  Discard any leading OWS characters from input_string.
#
#     6.  If input_string is empty, there is a trailing comma; fail
#         parsing.
#
# 3.  No structured data has been found; return members (which is
#     empty).
def parseList(src):
    value = []

    while len(src) > 0:
        parsedItemOrInnerList = parseItemOrInnerList(src)
        value.append(parsedItemOrInnerList.value)

        src = parsedItemOrInnerList.src.strip()
        if len(src) == 0:
            return ParsedValue(value, src)

        if src[0] != ",":
            raise parseError(src, LIST)

        src = src[1:].strip()
        if len(src) == 0 or src[0] == ",":
            raise parseError(src, LIST)

    return ParsedValue(value, src)
