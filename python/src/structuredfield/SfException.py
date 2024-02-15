class SfException(BaseException):
    def __init__(self, message, cause=None):
        self.message = message
        self.cause = cause
