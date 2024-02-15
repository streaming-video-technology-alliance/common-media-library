from ...structuredfield.SfException import SfException


def throwError(action, src, type, cause=None):
    message = f'failed to {action} "{src}" as {type}'
    return SfException(message, cause)
