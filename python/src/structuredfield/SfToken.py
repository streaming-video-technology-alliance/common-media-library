class SfToken:
    """
    A class to represent structured field tokens

    @group Structured Field

    @beta
    """

    def __init__(self, description):
        self.description = description

    def __eq__(self, other):
        if not isinstance(other, SfToken):
            return False

        return self.description == other.description

    def __str__(self):
        return "SfToken(description={})".format(self.description)
