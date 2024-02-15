from .parse.parseError import parseError
from .parse.parseList import parseList
from .SfException import SfException
from .utils.LIST import LIST


def decodeSfList(input):
    """
    Decode a structured field string into a structured field list

    @param input - The structured field string to decode
    @returns The structured field list

    @group Structured Field

    @beta
    """
    try:
        list = parseList(input.strip())
        if list.src != "":
            raise parseError(list.src, LIST)

        return list.value

    except SfException as cause:
        raise parseError(input, LIST, cause)
