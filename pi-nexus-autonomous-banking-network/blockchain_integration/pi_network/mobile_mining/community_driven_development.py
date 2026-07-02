import re
import subprocess


class CommunityDrivenDevelopment:
    # Allow only refs made of alphanumerics, dash, underscore, slash, and dot.
    # This deliberately excludes shell metacharacters (;, &, |, `, $, spaces).
    _REF_PATTERN = re.compile(r'^[A-Za-z0-9._/-]{1,200}$')

    def __init__(self):
        self.contributors = []

    def add_contributor(self, contributor):
        self.contributors.append(contributor)

    def submit_pull_request(self, contributor, pull_request):
        # Review and merge pull request
        if self.validate_pull_request(pull_request):
            self.merge_pull_request(pull_request)
            print(f"Pull request from {contributor} merged successfully!")
        else:
            print(f"Pull request from {contributor} rejected.")

    def validate_pull_request(self, pull_request):
        # Reject any ref name that contains shell metacharacters or is empty.
        return bool(self._REF_PATTERN.match(pull_request or ''))

    def merge_pull_request(self, pull_request):
        # Pass args as a list with shell=False so the ref name is never
        # interpreted by /bin/sh, even if validation is ever loosened later.
        if not self.validate_pull_request(pull_request):
            raise ValueError(f"Refusing to merge invalid ref: {pull_request!r}")
        subprocess.run(['git', 'merge', '--', pull_request], shell=False, check=False)


if __name__ == '__main__':
    cdd = CommunityDrivenDevelopment()
    contributor1 = 'Alice'
    contributor2 = 'Bob'
    cdd.add_contributor(contributor1)
    cdd.add_contributor(contributor2)
    pull_request1 = 'feature/new-feature'
    pull_request2 = 'fix/bug-fix'
    cdd.submit_pull_request(contributor1, pull_request1)
    cdd.submit_pull_request(contributor2, pull_request2)
