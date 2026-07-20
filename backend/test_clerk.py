from clerk_backend_api import Clerk
import inspect

clerk = Clerk(bearer_auth="test")
print(dir(clerk.users))
print(inspect.signature(clerk.users.get))
