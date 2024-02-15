from .parseBareItem import parseBareItem
from .ParsedValue import ParsedValue
from .parseKey import parseKey


# 4.2.3.2.  Parsing Parameters
#
# Given an ASCII string as input_string, return an ordered map whose
# values are bare Items. input_string is modified to remove the parsed
# value.
#
# 1.  Let parameters be an empty, ordered map.
#
# 2.  While input_string is not empty:
#
#     1.  If the first character of input_string is not ";", exit the
#         loop.
#
#     2.  Consume a ";" character from the beginning of input_string.
#
#     3.  Discard any leading SP characters from input_string.
#
#     4.  let param_name be the result of running Parsing a Key
#         (Section 4.2.3.3) with input_string.
#
#     5.  Let param_value be Boolean true.
#
#     6.  If the first character of input_string is "=":
#
#         1.  Consume the "=" character at the beginning of
#             input_string.
#
#         2.  Let param_value be the result of running Parsing a Bare
#             Item (Section 4.2.3.1) with input_string.
#
#     7.  Append key param_name with value param_value to parameters.
#         If parameters already contains a name param_name (comparing
#         character-for-character), overwrite its value.
#
# 3.  Return parameters.
#
# Note that when duplicate Parameter keys are encountered, this has the
# effect of ignoring all but the last instance.
def parseParameters(src):
    parameters = None

    while len(src) > 0:
        if src[0] != ";":
            break

        src = src[1:].strip()
        parsedKey = parseKey(src)
        key = parsedKey.value
        value = True
        src = parsedKey.src

        if src and src[0] == "=":
            src = src[1:]
            parsedBareItem = parseBareItem(src)
            value = parsedBareItem.value
            src = parsedBareItem.src

        # initialize as object when params exists
        if parameters == None:
            parameters = {}

        # override if param_name exists
        parameters[key] = value

    return ParsedValue(parameters, src)
